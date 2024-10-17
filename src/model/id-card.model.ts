import * as fs from 'fs';
import * as path from 'path';

export class IdCardModel {
    foto: Buffer;
    qrCode: Buffer;
    nama: string;
    perusahaan: string;
    noPegawai: string;
    negara: string;
    logoBuffer: Buffer;

    constructor(foto: Buffer, qrCode: Buffer, nama: string, perusahaan: string, noPegawai: string, negara: string) {
        this.foto = foto;
        this.qrCode = qrCode;
        this.nama = nama;
        this.perusahaan = perusahaan;
        this.noPegawai = noPegawai;
        this.negara = negara;
        this.logoBuffer = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'assets', 'images', 'Logo_GMF_Aero_Asia.png'));
    }

    private getMediaType(buffer: Buffer): string {
        const header = buffer.toString('hex', 0, 4);
        if (header.startsWith('89504e47')) return 'image/png'; // PNG
        if (header.startsWith('ffd8ff')) return 'image/jpeg'; // JPEG
        if (header.startsWith('25504446')) return 'application/pdf'; // PDF
        return ''; // Unknown type
    }

    async getHtmlTemplate(): Promise<string> {
        const photoBase64 = this.foto ? this.foto.toString('base64') : '';
        const qrCodeBase64 = this.qrCode ? this.qrCode.toString('base64') : '';
        const logoBase64 = this.logoBuffer.toString('base64');

        const photoType = this.foto ? this.getMediaType(this.foto) : '';
        const qrCodeType = this.qrCode ? this.getMediaType(this.qrCode) : '';

        return `
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ID Card</title>
            <style>
                .id-card-container {
                    font-family: 'Petrona', sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 50px;
                }
            
                .logo {
                    border-bottom: 4px solid #02507E;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 10px 0;
                }
            
                hr {
                    background-color: #02507E;
                    margin-top: 4px;
                    border: 1px solid #02507E;
                    border-color: #02507E;
                    margin-bottom: 0;
                }
            
                .img {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 50px;
                    height: 150px;
                    margin-bottom: 20px;
                }
            
                .id-card {
                    width: 320px;
                    height: 440px;
                    background-color: #fff;
                    border: 3px solid #000;
                    overflow: hidden;
                }
            
                .id-card-front {
                    padding-left: 10px;
                    padding-right: 10px;
                    justify-content: center;
                    text-align: center;
                }
            
                .id-card-back {
                    padding-left: 10px;
                    padding-right: 10px;
                    text-align: center;
                }
            
                .logo img {
                    height: 50px;
                    width: 200px;
                }
            
                .id-card-front h2 {
                    font-size: 16px;
                    margin-bottom: 30px;
                }
            
                .id-card-front .photo img {
                    width: 118px;
                    height: 157.3px;
                    object-fit: cover;
                }
            
                .details p {
                    display: flex;
                    justify-content: space-between;
                    font-size: 14px;
                    margin: 5px 0;
                }
            
                .details p span:first-child {
                    flex-basis: 40%;
                    text-align: left;
                }
            
                .details p span:last-child {
                    flex-basis: 90%;
                    text-align: left;
                }
            
                .id-card-front .qr-code img {
                    width: 100%;
                    height: 100px;
                }
            
                .id-card-back p {
                    margin: 0;
                    justify-content: center;
                    padding-left: 20px;
                    padding-right: 20px;
                    font-size: 15px;
                    text-align: start;
                }
            
                .id-card-back #p1 {
                    margin-top: 10px;
                }
            
                .id-card-back #p3 {
                    margin-top: 10px;
                }
            
                .id-card-back #p4 {
                    margin-top: 10px;
                }
            
                .id-card-back .footer {
                    margin: 20px;
                    margin-top: 0;
                    text-align: center;
                }
            
                .id-card-back strong {
                    display: block;
                    font-size: 16px;
                }
            </style>
        </head>
        <body>
            <div class="id-card-container">
                <!-- Front Side -->
                <div class="id-card">
                <div class="logo">
                    <img src="data:image/png;base64,${logoBase64}" alt="GMF AeroAsia">
                </div>
                <hr>
                <div class="id-card-front">
                    <h2>PERSONEL PERALATAN PELAYANAN DARAT PESAWAT UDARA
                        <br>
                        (GSE Operator)
                    </h2>
                    <div class="img">
                        <div class="photo">
                            <img src="data:/image/${photoType};base64,${photoBase64}" alt="Profile Picture">
                        </div>
                        <div class="qr-code">
                            <img src="data:image/${qrCodeType};base64,${qrCodeBase64}" alt="QR Code">
                        </div>
                    </div>
                    <div class="details">
                        <p><span>Name</span><span>: ${this.nama}</span></p>
                        <p><span>Company</span><span>: ${this.perusahaan}</span></p>
                        <p><span>ID Number</span><span>: ${this.noPegawai}</span></p>
                        <p><span>Nationality</span><span>: ${this.negara}</span></p>
                    </div>          
                </div>
                </div>

                <!-- Back Side -->
                <div class="id-card">
                    <div class="logo">
                        <img src="data:image/png;base64,${logoBase64}" alt="GMF AeroAsia">
                    </div>
                    <hr>
                    <div class="id-card-back">
                    <p id="p1">Kartu ini merupakan kartu ijin mengendarai kendaraan ground support equipment (GSE) berdasarkan kompetensi yang dimiliki masing-masing pemegang kartu ini.</p>
                    <p id="p2">Dengan digunakannya kartu ini, Pemegang kartu menyatakan tunduk dan patuh pada peraturan yang berlaku.</p>
                    <br>
                    <p id="p3">Jika kartu ini ditemukan, mohon dikembalikan ke:</p>
                    <br>
                    <p id="p4" class="footer"><strong>Gedung Posko GMF</strong>Area Perkantoran Bandara Soekarno Hatta - Tangerang, Banten</p>
                    </div>
                </div>
            </div>
        </body>
        `;
    }
}
