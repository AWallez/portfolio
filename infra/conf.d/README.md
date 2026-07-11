# conf.d — blocs Caddy locaux à la machine

Les fichiers `*.caddy` déposés ici sont importés par le Caddyfile
(`import conf.d/*.caddy`) mais **jamais versionnés** (gitignorés) :
ils survivent donc aux `git reset --hard` des déploiements.

Usage : sous-domaines de services personnels hors portfolio. Si ces blocs
nécessitent des plugins Caddy ou l'accès à d'autres réseaux Docker, les
déclarer dans un `docker-compose.override.yml` local (lui aussi gitignoré,
chargé automatiquement par Docker Compose) :

```yaml
services:
  caddy:
    image: mon-caddy-avec-plugins:local
    networks: [default, autre_stack_default]

networks:
  autre_stack_default:
    external: true
```
