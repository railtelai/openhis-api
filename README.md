## 1. Run Keycloak in Docker

```bash
docker rm -f keycloak
docker run -d --name keycloak -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:26.0.0 start-dev
```

> Wait ~30 seconds → Access at: `http://<your-ip>:8080`

---

## 2. Configure Keycloak via Admin CLI

```bash
docker exec -it keycloak bash
```

```bash
cd /opt/keycloak/bin
./kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin
./kcadm.sh update realms/master -s sslRequired=NONE
exit
```

> Allows HTTP (dev only)

---

## 3. Create Client: `nestjs-clienttest`

### Step 1: Create Client

- Go to **Clients → Create client**
- **Client type**: `OpenID Connect`
- **Client ID**: `nestjs-clienttest`
- Click **Next**

---

### Step 2: Client Settings

| Field                     | Value     |
| ------------------------- | --------- |
| **Client authentication** | **ON**    |
| **Authorization**         | **OFF**   |
| **Standard flow**         | Unchecked |
| **Direct access grants**  | Checked   |
| **Service accounts**      | Checked   |

Click **Next** → **Save**

---

### Step 3: Login Settings

| Field                               | Value      |
| ----------------------------------- | ---------- |
| **Root URL**                        | `http://*` |
| **Home URL**                        | `http://*` |
| **Valid redirect URIs**             | `*`        |
| **Valid post logout redirect URIs** | `*`        |
| **Web origins**                     | `*`        |

Click **Save**

---

### Step 4: Get Client Secret

1. Go to **Credentials** tab
2. Copy **Client Secret** → Example: `a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8`

---

### Step 5: Assign Service Account Roles

1. Go to **Service account roles** tab
2. Click **Assign role** → **Filter by clients**
3. Select **realm-management**
4. Assign these roles:

| Role            | Purpose             |
| --------------- | ------------------- |
| `manage-users`  | Create/update users |
| `view-users`    | Read users          |
| `view-realm`    | View realm config   |
| `create-client` | Create clients      |

Click **Assign**

---

## 4. `.env` File (Project Root)

```env
CLIENT_ID=nestjs-clienttest
CLIENT_SECRET=r5RakOYpEzmRoQsgi3sVFY58IbX73kPF
KEYCLOAK_URL=http://35.224.185.200:8080
REALM=master
ENCRYPTION_KEY=alien
```

> Replace `<your-vm-ip>` and secret

---

## 5. API Endpoints (Postman / curl)

### 1. Create User (Admin API)

```http
POST http://localhost:3000/auth/create
Content-Type: application/json
```

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "MyPass123!"
}
```

---

### 2. Login (Sets 3 Encrypted Cookies)

```http
POST http://localhost:3000/auth/login
Content-Type: application/json
user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
```

```json
{
  "username": "alice",
  "password": "MyPass123!"
}
```

> Sets cookies:
>
> - `access_token`
> - `refresh_token`
> - `browser_token` (binds to `user-agent`)

---

### 3. Debug Tokens (Decrypt + Log All)

```http
GET http://localhost:3000/auth/debug-tokens
user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
```

**Send cookies from login**

**Response:**

```json
{
  "debug": true,
  "browser_token_match": true,
  "tokens": {
    "access": { "payload": { "sub": "...", "email": "alice@example.com", "roles": [...] } },
    "refresh": { "raw": "..." },
    "browser": { "raw": "Mozilla/5.0 ..." }
  },
  "req_user": { ... }
}
```
