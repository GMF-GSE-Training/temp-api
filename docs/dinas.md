# Dinas API Spec

## Create Dinas

Endpoint : POST /api/dinas

Headers :
- Authorization : token

Request Body :

```json
{
    "dinas": "TU"
}
```

Response Body :

```json
{
    "status": "success",
    "data": {
        "id": 1,
        "dinas": "TU"
    }
}
```

## Get All Dinas

Endpoint : GET api/dinas

Headers : 
- Authorization : token

Response Body :

```json
{
    "status": "success",
    "data": [
        {
            "id": 1,
            "dinas": "TU",
        },
        {
            "id": 2,
            "dinas": "TZ",
        },
        {
            "id": 3,
            "dinas": "TM",
        },
        {
            "id": 4,
            "dinas": "TL",
        }
    ]
}
```

## Get Dinas By Id

Endpoint : GET api/dinas/:dinasId

Headers : 
- Authorization : token

Response Body :

```json
{
    "status": "success",
    "data": {
        "id": 1,
        "dinas": "TU"
    }
}
```

## Update Role

Endpoint : PUT api/dinas/:dinasId

Headers : 
- Authorization : token

Request Body :

```json
{
    "dinas": "TZ"
}
```

Response Body :

```json
{
    "status": "success",
    "data": {
        "id": 1,
        "dinas": "TZ"
    }
}
```

## Delete Role

Endpoint : DELETE api/dinas/:dinasId

Headers : 
- Authorization : token

Response Body :

```json
{
    "status": "success",
    "data": true
}
```