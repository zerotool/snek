# Server Deploy

1. Copy `inventory.example.ini` to `inventory.ini`.
2. Copy `group_vars/all.yml.example` to `group_vars/all.yml`.
3. Fill in the domain, database password, Rails secrets, and any Stripe/Rollbar values you need.
4. Run:

```bash
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/site.yml --become
```

The playbook installs Docker Engine and the Compose plugin, checks out the repository into `/opt/snek`, renders `.env.server`, runs `rails db:create db:migrate`, and starts the production stack from `docker-compose.server.yml`.

The stack exposes only Caddy on the host. Postgres and Redis stay internal to Docker.
