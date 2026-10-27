// ==============================================================================
// MAROUKI FRIPPE - WEBAUTHN PASSKEY AUTHENTICATION & ONE-TIME INVITES (passkey.js)
// ==============================================================================
// Enables biometric logins (Face ID, Touch ID, Windows Hello) & one-time setup links.
// Backed permanently by Supabase PostgreSQL tables: admin_passkeys & admin_invite_tokens.

const MaroukiPasskey = {
    // --------------------------------------------------------------------------
    // Encoding & Utility Helpers
    // --------------------------------------------------------------------------
    bufferToBase64Url(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    },

    base64UrlToBuffer(base64url) {
        let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    },

    generateRandomToken(length = 32) {
        const bytes = new Uint8Array(length);
        window.crypto.getRandomValues(bytes);
        return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    },

    generateRecoveryCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'MF-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    // --------------------------------------------------------------------------
    // Platform Capability Check
    // --------------------------------------------------------------------------
    isSupported() {
        return Boolean(
            typeof window !== 'undefined' &&
            window.PublicKeyCredential &&
            navigator.credentials &&
            navigator.credentials.create &&
            navigator.credentials.get
        );
    },

    async isPlatformAuthenticatorAvailable() {
        if (!this.isSupported()) return false;
        try {
            if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
                return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            }
            return true;
        } catch (e) {
            return false;
        }
    },

    // --------------------------------------------------------------------------
    // 1. One-Time Setup Link Generation
    // --------------------------------------------------------------------------
    async createOneTimeInvite(adminName = 'Propriétaire', hoursValid = 48) {
        if (typeof maroukiSupabase === 'undefined' || !maroukiSupabase) {
            throw new Error("Base Supabase non connectée");
        }

        const token = this.generateRandomToken(24);
        const expiresAt = new Date(Date.now() + hoursValid * 3600 * 1000).toISOString();

        const { error } = await maroukiSupabase
            .from('admin_invite_tokens')
            .insert({
                token: token,
                admin_name: adminName.trim(),
                created_by: 'Owner',
                expires_at: expiresAt,
                used: false
            });

        if (error) {
            console.error("Failed to insert invite token in Supabase:", error);
            throw error;
        }

        const origin = window.location.origin;
        return {
            token,
            adminName,
            expiresAt,
            url: `${origin}/admin?setup_passkey=${token}`
        };
    },

    // --------------------------------------------------------------------------
    // 2. Validate One-Time Setup Token
    // --------------------------------------------------------------------------
    async validateInviteToken(token) {
        if (!token) return { valid: false, reason: "Aucun jeton fourni" };

        if (typeof maroukiSupabase === 'undefined' || !maroukiSupabase) {
            return { valid: false, reason: "Base de données inaccessible" };
        }

        try {
            const { data, error } = await maroukiSupabase
                .from('admin_invite_tokens')
                .select('*')
                .eq('token', token)
                .single();

            if (error || !data) {
                return { valid: false, reason: "Lien d'invitation introuvable ou expiré" };
            }

            if (data.used) {
                return { valid: false, reason: "Ce lien d'invitation a déjà été utilisé" };
            }

            const expires = new Date(data.expires_at).getTime();
            if (Date.now() > expires) {
                return { valid: false, reason: "Ce lien d'invitation a expiré" };
            }

            return { valid: true, adminName: data.admin_name, data };
        } catch (err) {
            return { valid: false, reason: err.message };
        }
    },

    // --------------------------------------------------------------------------
    // 3. Register Passkey from an Invite Link
    // --------------------------------------------------------------------------
    async registerPasskeyFromInvite(token) {
        const validation = await this.validateInviteToken(token);
        if (!validation.valid) {
            throw new Error(validation.reason);
        }

        if (!this.isSupported()) {
            throw new Error("Votre navigateur ou appareil ne supporte pas les Passkeys WebAuthn");
        }

        const adminName = validation.adminName || 'Propriétaire';
        const challengeBytes = new Uint8Array(32);
        window.crypto.getRandomValues(challengeBytes);

        const userId = new TextEncoder().encode(adminName + '-' + Date.now());

        const createOptions = {
            publicKey: {
                challenge: challengeBytes,
                rp: {
                    name: "Marouki Frippe Admin",
                    id: window.location.hostname
                },
                user: {
                    id: userId,
                    name: adminName.toLowerCase().replace(/[^a-z0-9]/g, '_') + "@marouki.fripe",
                    displayName: adminName
                },
                pubKeyCredParams: [
                    { alg: -7, type: "public-key" },   // ES256
                    { alg: -257, type: "public-key" }  // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "preferred",
                    residentKey: "preferred"
                },
                timeout: 60000,
                attestation: "none"
            }
        };

        const credential = await navigator.credentials.create(createOptions);
        if (!credential) {
            throw new Error("L'enregistrement du Passkey a été annulé");
        }

        const credentialId = this.bufferToBase64Url(credential.rawId);
        const recoveryCode = this.generateRecoveryCode();

        let publicKeyStr = '';
        if (credential.response && credential.response.getPublicKey) {
            try {
                const pkBuffer = credential.response.getPublicKey();
                publicKeyStr = this.bufferToBase64Url(pkBuffer);
            } catch (e) {
                publicKeyStr = credentialId;
            }
        } else {
            publicKeyStr = credentialId;
        }

        // Save passkey in Supabase
        const { error: insertErr } = await maroukiSupabase
            .from('admin_passkeys')
            .insert({
                credential_id: credentialId,
                admin_name: adminName,
                public_key: publicKeyStr,
                raw_id: credentialId,
                recovery_code: recoveryCode,
                transports: credential.response && credential.response.getTransports ? credential.response.getTransports() : ["internal"],
                last_used_at: new Date().toISOString()
            });

        if (insertErr) {
            console.error("Failed to store Passkey credential:", insertErr);
            throw new Error("Impossible d'enregistrer le Passkey dans la base : " + insertErr.message);
        }

        // Burn the one-time token immediately
        await maroukiSupabase
            .from('admin_invite_tokens')
            .update({
                used: true,
                used_at: new Date().toISOString()
            })
            .eq('token', token);

        return {
            success: true,
            adminName,
            credentialId,
            recoveryCode
        };
    },

    // --------------------------------------------------------------------------
    // 4. Biometric Authentication (Login)
    // --------------------------------------------------------------------------
    async authenticate() {
        if (!this.isSupported()) {
            throw new Error("Votre appareil ou navigateur ne supporte pas l'authentification Passkey");
        }

        if (typeof maroukiSupabase === 'undefined' || !maroukiSupabase) {
            throw new Error("Base Supabase non connectée");
        }

        // Fetch registered credentials from database
        const { data: registered, error } = await maroukiSupabase
            .from('admin_passkeys')
            .select('credential_id, admin_name');

        if (error) {
            throw new Error("Erreur de connexion à la base : " + error.message);
        }

        if (!registered || registered.length === 0) {
            return {
                success: false,
                noPasskeysConfigured: true,
                reason: "Aucun Passkey n'est encore configuré. Utilisez votre code de secours ou un lien d'invitation."
            };
        }

        const allowCredentials = registered.map(item => ({
            id: this.base64UrlToBuffer(item.credential_id),
            type: "public-key"
        }));

        const challengeBytes = new Uint8Array(32);
        window.crypto.getRandomValues(challengeBytes);

        const getOptions = {
            publicKey: {
                challenge: challengeBytes,
                allowCredentials: allowCredentials,
                userVerification: "preferred",
                timeout: 60000
            }
        };

        const assertion = await navigator.credentials.get(getOptions);
        if (!assertion) {
            throw new Error("Authentification annulée");
        }

        const usedCredId = this.bufferToBase64Url(assertion.rawId);
        const match = registered.find(r => r.credential_id === usedCredId);
        const adminName = match ? match.admin_name : "Administrateur";

        // Update last used timestamp
        await maroukiSupabase
            .from('admin_passkeys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('credential_id', usedCredId);

        return {
            success: true,
            adminName,
            credentialId: usedCredId
        };
    },

    // --------------------------------------------------------------------------
    // 5. Emergency Recovery Code Verification
    // --------------------------------------------------------------------------
    async verifyRecoveryCode(inputCode) {
        const clean = (inputCode || '').trim().toUpperCase();
        if (!clean) return { success: false, reason: "Code requis" };

        if (typeof maroukiSupabase === 'undefined' || !maroukiSupabase) {
            return { success: false, reason: "Base inaccessible" };
        }

        try {
            const { data, error } = await maroukiSupabase
                .from('admin_passkeys')
                .select('*')
                .eq('recovery_code', clean)
                .limit(1);

            if (error || !data || data.length === 0) {
                // Fallback check on boutique_config admin_pin
                const { data: cfg } = await maroukiSupabase
                    .from('boutique_config')
                    .select('admin_pin')
                    .eq('id', 'main')
                    .single();
                
                if (cfg && cfg.admin_pin && cfg.admin_pin === clean) {
                    return { success: true, adminName: "Propriétaire (PIN)" };
                }
                return { success: false, reason: "Code de secours ou PIN invalide" };
            }

            const row = data[0];
            await maroukiSupabase
                .from('admin_passkeys')
                .update({ last_used_at: new Date().toISOString() })
                .eq('credential_id', row.credential_id);

            return {
                success: true,
                adminName: row.admin_name,
                credentialId: row.credential_id
            };
        } catch (e) {
            return { success: false, reason: e.message };
        }
    },

    // --------------------------------------------------------------------------
    // 6. Management Utilities
    // --------------------------------------------------------------------------
    async listPasskeys() {
        if (typeof maroukiSupabase === 'undefined' || !maroukiSupabase) return [];
        const { data } = await maroukiSupabase
            .from('admin_passkeys')
            .select('credential_id, admin_name, recovery_code, created_at, last_used_at')
            .order('created_at', { ascending: false });
        return data || [];
    },

    async deletePasskey(credentialId) {
        if (typeof maroukiSupabase === 'undefined' || !maroukiSupabase) return false;
        const { error } = await maroukiSupabase
            .from('admin_passkeys')
            .delete()
            .eq('credential_id', credentialId);
        return !error;
    },

    async listPendingInvites() {
        if (typeof maroukiSupabase === 'undefined' || !maroukiSupabase) return [];
        const { data } = await maroukiSupabase
            .from('admin_invite_tokens')
            .select('*')
            .eq('used', false)
            .order('created_at', { ascending: false });
        return data || [];
    }
};
