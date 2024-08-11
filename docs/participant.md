# Participant API Spec

## Create Participant

Endpoint : POST /api/participants

Headers :
- Authorization : token

Request Body :

```json
{
    "no_pegawai": "12345",
    "name": "John Doe",
    "dinas": "TU",
    "bidang": "TLC-4",
    "perusahaan": "GMF",
    "email": "johndoe@gmail.com",
    "no_telp": "08123456789",
    "Kewarganegaraan": "Indonesia",
    "tempat_lahir": "Jakarta",
    "tanggal_lahir": "01/01/2000",
    "sim_a": "sim_a.jpg",
    "sim_b": "sim_b.jpd",
    "ktp": "ktp.jpg",
    "foto": "foto.jpg",
    "surat_sehat_buta_warna": "surat_sehat.jpg",
    "exp_surat_sehat": "08/06/2025",
    "surat_bebas_narkoba": "bebas_narkoba.jpg",
    "exp_bebas_narkoba": "08/02/2025",
    "gmf_nongmf": "GMF"
}
```

Response Body :

```json
{
    "no_pegawai": "12345",
    "name": "John Doe",
    "dinas": "TU",
    "bidang": "TLC-4",
    "perusahaan": "GMF",
    "email": "johndoe@gmail.com",
    "no_telp": "08123456789",
    "Kewarganegaraan": "Indonesia",
    "tempat_lahir": "Jakarta",
    "tanggal_lahir": "01/01/2000",
    "sim_a": "sim_a.jpg",
    "sim_b": "sim_b.jpd",
    "ktp": "ktp.jpg",
    "foto": "foto.jpg",
    "surat_sehat_buta_warna": "surat_sehat.jpg",
    "exp_surat_sehat": "08/06/2025",
    "surat_bebas_narkoba": "bebas_narkoba.jpg",
    "exp_bebas_narkoba": "08/02/2025",
    "gmf_nongmf": "GMF",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA... (base64 encoded QR code data)"
}
```

## Get All Participant

Endpoint : POST /api/participants

Headers :
- Authorization : token

Response Body :

```json
{
    "data": [
        {
            "id": 1,
            "no_pegawai": "12345",
            "name": "John Doe",
            "dinas": "TU",
            "bidang": "TLC-4",
            "perusahaan": "GMF",
            "email": "johndoe@gmail.com",
            "no_telp": "08123456789",
            "Kewarganegaraan": "Indonesia",
            "tempat_lahir": "Jakarta",
            "tanggal_lahir": "01/01/2000",
            "sim_a": "sim_a.jpg",
            "sim_b": "sim_b.jpd",
            "ktp": "ktp.jpg",
            "foto": "foto.jpg",
            "surat_sehat_buta_warna": "surat_sehat.jpg",
            "exp_surat_sehat": "08/06/2025",
            "surat_bebas_narkoba": "bebas_narkoba.jpg",
            "exp_bebas_narkoba": "08/02/2025",
            "gmf_nongmf": "GMF",
        },
        {
            "id": 2,
            "no_pegawai": "12345",
            "name": "John Doe",
            "dinas": "TU",
            "bidang": "TLC-4",
            "perusahaan": "GMF",
            "email": "johndoe@gmail.com",
            "no_telp": "08123456789",
            "Kewarganegaraan": "Indonesia",
            "tempat_lahir": "Jakarta",
            "tanggal_lahir": "01/01/2000",
            "sim_a": "sim_a.jpg",
            "sim_b": "sim_b.jpd",
            "ktp": "ktp.jpg",
            "foto": "foto.jpg",
            "surat_sehat_buta_warna": "surat_sehat.jpg",
            "exp_surat_sehat": "08/06/2025",
            "surat_bebas_narkoba": "bebas_narkoba.jpg",
            "exp_bebas_narkoba": "08/02/2025",
            "gmf_nongmf": "GMF",
        }
    ]
}
```

## Get Participant By Id

Endpoint : POST /api/participants

Headers :
- Authorization : token

Response Body :

```json
{
    "data": {
        "id": 1,
        "no_pegawai": "12345",
        "name": "John Doe",
        "dinas": "TU",
        "bidang": "TLC-4",
        "perusahaan": "GMF",
        "email": "johndoe@gmail.com",
        "no_telp": "08123456789",
        "Kewarganegaraan": "Indonesia",
        "tempat_lahir": "Jakarta",
        "tanggal_lahir": "01/01/2000",
        "sim_a": "sim_a.jpg",
        "sim_b": "sim_b.jpd",
        "ktp": "ktp.jpg",
        "foto": "foto.jpg",
        "surat_sehat_buta_warna": "surat_sehat.jpg",
        "exp_surat_sehat": "08/06/2025",
        "surat_bebas_narkoba": "bebas_narkoba.jpg",
        "exp_bebas_narkoba": "08/02/2025",
        "gmf_nongmf": "GMF",
        "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA... (base64 encoded QR code data)"
    },
    "training": [
        
    ]
    }
}
```

## Update 