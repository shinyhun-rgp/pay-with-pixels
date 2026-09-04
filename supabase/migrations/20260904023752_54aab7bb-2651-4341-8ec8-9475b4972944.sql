-- Ensure the primary owner account is admin (no invite required)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email IN ('njengagodfrey74@gmail.com','njengagodfrey740@gmail.com')
ON CONFLICT DO NOTHING;

-- Seed products (idempotent by slug)
WITH cats AS (
  SELECT
    (SELECT id FROM public.categories WHERE slug='endpoint-protection') AS defense,
    (SELECT id FROM public.categories WHERE slug='threat-intelligence') AS offense
)
INSERT INTO public.products (name, slug, description, price, category_id, is_active, sort_order)
SELECT v.name, v.slug, v.description, v.price, CASE WHEN v.side='def' THEN cats.defense ELSE cats.offense END, true, v.sort
FROM cats, (VALUES
  ('SMTP Cracker Pro','smtp-cracker-pro','High-throughput SMTP checker with proxy rotation and hit logging.',180,'off',10),
  ('Inbox Sender Suite','inbox-sender-suite','Bulk mailer with inbox-first delivery, template editor and warmup.',260,'off',11),
  ('OTP Bot Gateway','otp-bot-gateway','Automated call/SMS OTP interception bot with multi-service scripts.',320,'off',12),
  ('Residential Proxy Pack','residential-proxy-pack','10GB rotating residential proxies, sticky sessions, global exits.',95,'off',13),
  ('Phishing Kit Builder','phishing-kit-builder','Drag-and-drop landing page builder with 40+ branded templates.',210,'off',14),
  ('Cookie Grabber','cookie-grabber','Session cookie stealer with encrypted exfil channel and log parser.',145,'off',15),
  ('RDP Bruteforcer','rdp-bruteforcer','Multi-threaded RDP checker with country filter and uptime monitor.',175,'off',16),
  ('Crypto Drainer Contract','crypto-drainer-contract','Multi-chain drainer smart contract with dashboard and payouts.',450,'off',17),
  ('EDR Bypass Loader','edr-bypass-loader','Custom loader with syscall unhooking, sleep obfuscation and AMSI patch.',380,'def',20),
  ('SOC Playbook Bundle','soc-playbook-bundle','60 incident-response playbooks for common intrusion patterns.',120,'def',21),
  ('Threat Feed API','threat-feed-api','Daily IOC feed: malware C2s, phishing domains, cracked-account dumps.',150,'def',22),
  ('Log Correlation Engine','log-correlation-engine','Self-hosted SIEM rules pack for Wazuh, Splunk and Elastic.',200,'def',23),
  ('Malware Sandbox License','malware-sandbox-license','1-seat license for cloud sandbox with 500 detonations/month.',275,'def',24),
  ('Dark Web Monitor','dark-web-monitor','Continuous scanning of forums and markets for your keywords.',165,'def',25)
) AS v(name,slug,description,price,side,sort)
ON CONFLICT (slug) DO NOTHING;