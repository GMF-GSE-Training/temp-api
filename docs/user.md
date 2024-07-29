# User API Spec

## Register User

Endpoint : POST /api/users

Request Body :

```json
{
  "email": "johndoe@example.com",
  "name": "Jogn Doe",
  "password": "rahasia",
  "dinas": "TU",
  "role": "super admin",
  "no_peg": "12345"
}
```

Response Body :

```json
{
  "data": {
    "id": 1,
    "email": "johndoe@example.com",
    "name": "Jogn Doe",
    "dinas": "TU",
    "role": "super admin",
    "no_peg": "12345"
  }
}
```

## Login User

Endpoint : POST /api/users/login

Request Body :

```json
{
  "identifier": "johndoe@example.com, 12345",
  "password": "rahasia",
}
```

Response Body :

```json
{
  "data": {
    "id": 1,
    "email": "johndoe@example.com",
    "name": "Jogn Doe",
    "dinas": "TU",
    "role": "super admin",
    "no_peg": "12345",
    "token": "session_id_generated"
  }
}
```

## Create User

Endpoint : POST /api/users

Headers :
- Authorization : token

Request Body :

```json
{
    "email": "johndoe@example.com",
    "name": "John Doe",
    "password": "rahasia",
    "dinas": "TU",
    "role": "super admin",
    "no_peg": "12345"
}
```

Response Body :

```json
{
  "data": {
    "id": 1,
    "email": "johndoe@example.com",
    "name": "Jogn Doe",
    "dinas": "TU",
    "role": "super admin",
    "no_peg": "12345",
    "token": "session_id_generated"
  }
}
```

## Get User

Endpoint : GET /api/users/me

Headers :
- Authorization : token

Response Body :

```json
{
  "data": {
    "id": 1,
    "email": "johndoe@example.com",
    "name": "Jogn Doe",
    "dinas": "TU",
    "role": "super admin",
    "no_peg": "12345",
    "token": "session_id_generated"
  }
}
```

## Get All Users

Endpoint : GET /api/users

Headers :
- Authorization : token

Response Body :

```json
{
  "data": [
    {
        "id": 1,
        "email": "johndoe@example.com",
        "name": "Jogn Doe",
        "dinas": "TU",
        "role": "super admin",
        "no_peg": "12345",
        "token": "session_id_generated"
    },
    {
        "id": 2,
        "email": "johndoe@example.com",
        "name": "Jogn Doe",
        "dinas": "TU",
        "role": "super admin",
        "no_peg": "12345",
        "token": "session_id_generated"
    }
  ]
}
```

## Update User

Endpoint : PATCH /api/users/me

Headers :
- Authorization : token

Request Body :

```json
{
    "email": "johndoe@example.com, optional",
    "name": "John Doe, optional",
    "password": "rahasia, optional",
    "dinas": "TU, optional",
    "role": "super admin, optional",
    "no_peg": "12345, optional"
}
```

Response Body :

```json
{
  "data": {
    "id": 1,
    "email": "johndoe@example.com",
    "name": "Jogn Doe",
    "dinas": "TU",
    "role": "super admin",
    "no_peg": "12345",
    "token": "session_id_generated"
  }
}
```

## Update User By Id

Endpoint : PATCH /api/users

Headers :
- Authorization : token

Request Body :

```json
{
    "email": "johndoe@example.com, optional",
    "name": "John Doe, optional",
    "password": "rahasia, optional",
    "dinas": "TU, optional",
    "role": "super admin, optional",
    "no_peg": "12345, optional"
}
```

Response Body :

```json
{
  "data": {
    "id": 1,
    "email": "johndoe@example.com",
    "name": "Jogn Doe",
    "dinas": "TU",
    "role": "super admin",
    "no_peg": "12345",
    "token": "session_id_generated"
  }
}
```

## Logout User

Endpoint : PATCH /api/users/me

Headers :
- Authorization : token

Response Body :

```json
{
  "data": true
}
```