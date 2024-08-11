# Role API Spec

## Create Role

Endpoint : POST api/roles

Headers : 
- Authorization : token

Request Body :

```json
{
    "role": "super admin"
}
```

Response Body :

```json
{
    "status": "success",
    "data": {
        "id": 1,
        "role": "super admin"
    }
}
```

## Get All role

Endpoint : GET api/roles

Headers : 
- Authorization : token

Response Body :

```json
{
    "status": "success",
    "data": [
        {
            "id": 1,
            "role": "super admin",
        },
        {
            "id": 2,
            "role": "supervison",
        },
        {
            "id": 3,
            "role": "LCU",
        },
        {
            "id": 4,
            "role": "user",
        }
    ]
}
```

## Get Role By Id

Endpoint : GET api/roles/:roleId

Headers : 
- Authorization : token

Response Body :

```json
{
    "status": "success",
    "data": {
        "id": 1,
        "role": "super admin"
    }
}
```

## Update Role

Endpoint : PUT api/roles/:roleId

Headers : 
- Authorization : token

Request Body :

```json
{
    "role": "LCU"
}
```

Response Body :

```json
{
    "status": "success",
    "data": {
        "id": 1,
        "role": "LCU"
    }
}
```

## Delete Role

Endpoint : DELETE api/roles/:roleId

Headers : 
- Authorization : token

Response Body :

```json
{
    "status": "success",
    "data": true
}
```