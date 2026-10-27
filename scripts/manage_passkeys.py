#!/usr/bin/env python3
"""
Marouki Frippe - Passkey & Invite CLI Tool
Manage WebAuthn Passkeys, one-time invite links, and recovery codes backed by Supabase.
"""

import sys
import os
import json
import secrets
import argparse
from datetime import datetime, timedelta
import urllib.request
import urllib.error

SUPABASE_URL = "https://muwhwsgiuklmdysjvkrg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11d2h3c2dpdWtsbWR5c2p2a3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMTYxMjIsImV4cCI6MjEwODY5MjEyMn0.Cvd5-qFI0EVgd1hQLl2irnHlD9FeA0LHoUByGp0VDwo"
BASE_ADMIN_URL = "https://marouki-frippe-admin.vercel.app"

def request_supabase(endpoint, method="GET", data=None):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            return json.loads(res_body) if res_body else []
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        print(f"❌ Erreur Supabase ({e.code}): {err}")
        return None
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return None

def cmd_list(args):
    print("🔑 --- PASSKEYS ENREGISTRÉS ---")
    keys = request_supabase("admin_passkeys?select=*&order=created_at.desc")
    if keys:
        for k in keys:
            print(f" • Admin: {k.get('admin_name')} | Code Secours: {k.get('recovery_code')} | Créé le: {k.get('created_at')[:10]}")
    else:
        print(" (Aucun Passkey enregistré)")

    print("\n🎟️ --- JETONS D'INVITATION ACTIFS ---")
    tokens = request_supabase("admin_invite_tokens?select=*&used=eq.false&order=created_at.desc")
    if tokens:
        for t in tokens:
            print(f" • Admin: {t.get('admin_name')} | Expire: {t.get('expires_at')[:16]} | Jeton: {t.get('token')}")
            print(f"   Lien: {BASE_ADMIN_URL}/admin?setup_passkey={t.get('token')}")
    else:
        print(" (Aucun jeton d'invitation en attente)")

def cmd_generate(args):
    token = secrets.token_hex(20)
    expires = (datetime.utcnow() + timedelta(days=args.days)).isoformat() + "Z"
    payload = {
        "token": token,
        "admin_name": args.name.strip(),
        "created_by": "CLI Owner",
        "expires_at": expires,
        "used": False
    }
    res = request_supabase("admin_invite_tokens", method="POST", data=payload)
    if res is not None:
        invite_url = f"{BASE_ADMIN_URL}/admin?setup_passkey={token}"
        print("✨ Jeton d'invitation généré avec succès !")
        print(f"👤 Destinataire : {args.name}")
        print(f"⏳ Valide pendant : {args.days} jour(s)")
        print(f"🔗 Lien d'enrôlement unique : {invite_url}\n")
        print("Ce lien permettra à l'administrateur d'enregistrer son Face ID / Touch ID en 1 clic.")

def cmd_delete_passkey(args):
    ident = args.identifier.strip()
    res = request_supabase(f"admin_passkeys?or=(recovery_code.eq.{ident},admin_name.eq.{ident},credential_id.eq.{ident})", method="DELETE")
    if res is not None:
        print(f"✅ Passkey '{ident}' supprimé avec succès.")

def main():
    parser = argparse.ArgumentParser(description="Marouki Frippe Passkey Management CLI")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("list", help="Lister tous les passkeys et jetons actifs")

    gen_parser = subparsers.add_parser("generate", help="Générer un lien d'invitation unique")
    gen_parser.add_argument("name", help="Nom de l'administrateur (ex: Propriétaire)")
    gen_parser.add_argument("--days", type=int, default=7, help="Durée de validité en jours")

    del_parser = subparsers.add_parser("delete-passkey", help="Supprimer un passkey par nom ou code secours")
    del_parser.add_argument("identifier", help="Nom, Recovery code ou Credential ID")

    args = parser.parse_args()
    if args.command == "list":
        cmd_list(args)
    elif args.command == "generate":
        cmd_generate(args)
    elif args.command == "delete-passkey":
        cmd_delete_passkey(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
