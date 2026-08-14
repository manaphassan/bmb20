---
trigger: always_on
---

# Rule: Continuous Auto-Deploy to DietPi Host

1. **Auto-Sync Post Build**: Whenever HTML, CSS, JavaScript, or PHP files in `d:\HaNa_Innovation\bmb20` are updated or built, automatically verify that the deployment script `deploy.ps1` or `deploy-dietpi.sh` is executed to push the latest build to the DietPi server (`192.168.0.100` / `dietpi.local`).
2. **Target Path**: Deploy to `/var/www/html/` with ownership `www-data:www-data` and `644` file permissions.
3. **Safety Verification**: Ensure `hooks.json` lifecycle hook is active to handle seamless background deployment.
