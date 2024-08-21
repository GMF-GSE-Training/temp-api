import { HttpException, Injectable } from "@nestjs/common";
import { join } from 'path';
import { Response } from "express";
import { existsSync } from "fs";

@Injectable()
export class StaticService {
    getFile(filename: string, res: Response) {
        let subdirectory: string;

        // Tentukan subdirektori berdasarkan tipe file
        if (filename.startsWith('ktp')) {
            subdirectory = 'ktp';
        } else if (filename.startsWith('sim_a')) {
            subdirectory = 'sim_a';
        } else if (filename.startsWith('sim_b')) {
            subdirectory = 'sim_b';
        } else if (filename.startsWith('foto')) {
            subdirectory = 'foto';
        } else {
            throw new HttpException('File type not supported', 400);
        }

        // Tambahkan folder 'participants'
        const filePath = join(__dirname, '..', '..', 'uploads', 'participants', subdirectory, filename);
        console.log(`Attempting to access file: ${filePath}`);

        if (!existsSync(filePath)) {
            console.error(`File not found at path: ${filePath}`);
            throw new HttpException('File not found', 404);
        }

        res.sendFile(filePath);
    }
}