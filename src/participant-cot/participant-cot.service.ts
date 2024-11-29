import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CurrentUserRequest } from "src/model/auth.model";
import { addParticipantToCot, ParticipantCotResponse } from "src/model/participant-cot.model";
import { ListParticipantResponse } from "src/model/participant.model";
import { ListRequest, Paging, SearchRequest } from "src/model/web.model";
import { ParticipantCotValidation } from "./participant-cot.validation";

@Injectable()
export class ParticipantCotService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly validationService: ValidationService,
    ) { }

    async getUnregisteredParticipants(cotId: string, user: CurrentUserRequest, request: ListRequest): Promise<{ data: ListParticipantResponse[], paging: Paging }> {
        const userRole = user.role.name.toLowerCase();

        const currentCot = await this.prismaService.cOT.findUnique({
            where: { id: cotId },
            include: { capabilityCots: true },
        });
    
        if (!currentCot) {
            throw new Error('COT not found');
        }

        const capabilityIds = currentCot.capabilityCots.map((cc) => cc.capabilityId);
        const { startDate, endDate } = currentCot;
    
        const whereClause = {
            NOT: {
                participantsCots: {
                    some: { cotId: cotId },
                },
            },
            ...(userRole === 'lcu' && { dinas: user.dinas }),
            AND: [
                {
                    NOT: {
                        participantsCots: {
                            some: {
                                cot: {
                                    capabilityCots: {
                                        some: { capabilityId: { in: capabilityIds } },
                                    },
                                    OR: [
                                        { startDate: { lte: endDate }, endDate: { gte: startDate } },
                                    ],
                                },
                            },
                        },
                    },
                },
            ],
        };
    
        const [unregisteredParticipants, totalParticipants] = await Promise.all([
            this.prismaService.participant.findMany({
                where: whereClause,
                select: {
                    id: true,
                    idNumber: true,
                    name: true,
                    dinas: true,
                    bidang: true,
                    company: true,
                },
                skip: (request.page - 1) * request.size,
                take: request.size,
            }),
            this.prismaService.participant.count({ where: whereClause }),
        ]);
    
        const totalPage = Math.ceil(totalParticipants / request.size);
    
        return {
            data: unregisteredParticipants,
            paging: {
                currentPage: request.page,
                totalPage: totalPage,
                size: request.size
            }
        };
    }

    async addParticipantToCot(cotId: string, user: CurrentUserRequest, request: addParticipantToCot): Promise<string> {
        const AddParticipantToCotRequest= this.validationService.validate(ParticipantCotValidation.ADD, request);
    
        const userRole = user.role.name.toLowerCase();
    
        const cot = await this.prismaService.cOT.findUnique({
            where: { id: cotId },
            include: { capabilityCots: true },
        });
    
        if (!cot) {
            throw new HttpException('COT tidak ditemukan', 404);
        }
    
        const participants = await this.prismaService.participant.findMany({
            where: {
                id: { in: AddParticipantToCotRequest.participantIds },
                ...(userRole === 'lcu' && {
                    dinas: user.dinas
                })
            },
        });
    
        const validParticipantIds = participants.map(p => p.id);
    
        if (userRole === 'lcu' && validParticipantIds.length !== AddParticipantToCotRequest.participantIds.length) {
            throw new HttpException(
                `LCU hanya dapat menambahkan participant dari dinas yang sama (${user.dinas})`, 
                403
            );
        }
    
        // Filter hanya ID yang valid
        if (validParticipantIds.length === 0) {
            throw new HttpException('Tidak ada participant yang valid ditemukan', 404);
        }
    
        const overlappingParticipants = await this.prismaService.participantsCOT.findMany({
            where: {
                participantId: { in: validParticipantIds },
                cot: {
                    capabilityCots: {
                        some: { capabilityId: { in: cot.capabilityCots.map(cc => cc.capabilityId) } },
                    },
                    OR: [
                        {
                            startDate: { lte: cot.endDate },
                            endDate: { gte: cot.startDate },
                        },
                    ],
                },
            },
            include: { cot: true },
        });
    
        if (overlappingParticipants.length > 0) {
            const overlappingIds = overlappingParticipants.map(op => op.participantId);
            throw new HttpException(
                `Participant dengan ID berikut tidak dapat didaftarkan karena jadwal bertabrakan: ${overlappingIds.join(', ')}`,
                400
            );
        }
    
        const existingParticipants = await this.prismaService.participantsCOT.findMany({
            where: {
                cotId,
                participantId: { in: validParticipantIds },
            },
        });
    
        const existingParticipantIds = existingParticipants.map(p => p.participantId);
        const newParticipantIds = validParticipantIds.filter(id => !existingParticipantIds.includes(id));
    
        if (newParticipantIds.length === 0) {
            throw new HttpException('Semua participant yang valid sudah terdaftar di COT ini', 400);
        }
    
        const participantData = newParticipantIds.map(participantId => ({
            participantId,
            cotId,
        }));
    
        await this.prismaService.participantsCOT.createMany({
            data: participantData,
        });
    
        return `${newParticipantIds.length} participant berhasil ditambahkan`;
    }

    async listParticipantsCot(cotId: string, user: CurrentUserRequest, request: ListRequest): Promise<ParticipantCotResponse> {
        const userRole = user.role.name.toLowerCase();
    
        let participantWhereClause = userRole === 'lcu' ? {
            participant: {
                dinas: user.dinas,
            },
        } : undefined;
    
        const participantCot = await this.prismaService.cOT.findUnique({
            where: {
                id: cotId,
            },
            include: {
                capabilityCots: {
                    select: {
                        capability: true
                    }
                },
                participantsCots: {
                    where: participantWhereClause,
                    select: {
                        participant: {
                            select: {
                                id: true,
                                idNumber: true,
                                name: true,
                                dinas: true,
                                simB: true,
                                simA: true,
                                tglKeluarSuratSehatButaWarna: true,
                                tglKeluarSuratBebasNarkoba: true,
                            }
                        },
                    },
                    // Implement pagination at database level
                    skip: (request.page - 1) * request.size,
                    take: request.size,
                },
                _count: {
                    select: { participantsCots: true }
                }
            }
        });
    
        if (userRole === 'user') {
            const isParticipantLinked = participantCot?.participantsCots?.some(
                (pCot) => pCot.participant?.id === user.participantId
            );
        
            if (!isParticipantLinked) {
                throw new HttpException('Anda tidak bisa mengakses COT ini karena anda belum terdaftar', 403);
            }
        }
    
        const totalParticipants = await this.prismaService.participantsCOT.count({
            where: {
                cotId: cotId,
                ...(participantWhereClause || {}),
            }
        });
    
        // Calculate pagination
        const totalPage = Math.ceil(totalParticipants / request.size);
    
        // Ambil data participant dari participantsCots dan filter yang null
        const participants = participantCot.participantsCots
            .map(pc => {
                const participant = pc.participant;
                return participant ? {
                    ...participant,
                    simB: participant.simB ? true : false,
                    simA: participant.simB ? false : true,
                } : null;
            })
            .filter(participant => participant !== null);
    
        // Restructure response format
        const response: ParticipantCotResponse = {
            cot: {
                id: participantCot.id,
                startDate: participantCot.startDate,
                endDate: participantCot.endDate,
                trainingLocation: participantCot.trainingLocation,
                theoryInstructorRegGse: participantCot.theoryInstructorRegGse,
                theoryInstructorCompetency: participantCot.theoryInstructorCompetency,
                practicalInstructor1: participantCot.practicalInstructor1,
                practicalInstructor2: participantCot.practicalInstructor2,
                totalParticipants: totalParticipants,
                status: participantCot.status,
                capability: participantCot.capabilityCots[0].capability,
                participants: {
                    data: participants,
                    paging: {
                        currentPage: request.page,
                        totalPage: totalPage,
                        size: request.size,
                    },
                    actions: {
                        canPrint: true,
                        canDelete: true,
                        canView: true,
                    }
                }
            },
        };

        return response;
    }

    async searchParticipantCot(cotId: string, user: CurrentUserRequest, request: SearchRequest): Promise<ParticipantCotResponse> {
        const userRole = user.role.name.toLowerCase();
        let participantWhereClause: any = {};
    
        if (request.searchQuery) {
            const query = request.searchQuery.toLowerCase();
            participantWhereClause = {
                OR: [
                    { idNumber: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } },
                    { dinas: { contains: query, mode: 'insensitive' } },
                ]
            };
        }
    
        if (userRole === 'lcu') {
            participantWhereClause = {
                ...participantWhereClause,
                dinas: user.dinas
            };
        }
    
        const totalParticipants = await this.prismaService.participantsCOT.count({
            where: {
                cotId: cotId,
                participant: participantWhereClause
            }
        });
    
        const totalPage = Math.ceil(totalParticipants / request.size);
    
        const participantCot = await this.prismaService.cOT.findUnique({
            where: {
                id: cotId
            },
            include: {
                capabilityCots: {
                    select: {
                        capability: true
                    }
                },
                participantsCots: {
                    where: {
                        participant: participantWhereClause
                    },
                    select: {
                        participant: {
                            select: {
                                id: true,
                                idNumber: true,
                                name: true,
                                dinas: true,
                                simB: true,
                                simA: true,
                                tglKeluarSuratSehatButaWarna: true,
                                tglKeluarSuratBebasNarkoba: true,
                            }
                        }
                    },
                    skip: (request.page - 1) * request.size,
                    take: request.size,
                }
            }
        });
    
        // Ambil data participant dari participantsCots dan filter yang null
        const participants = participantCot.participantsCots
            .map(pc => {
                const participant = pc.participant;
                return participant ? {
                    ...participant,
                    simB: participant.simB ? true : false,
                    simA: participant.simB ? false : true,
                } : null;
            })
            .filter(participant => participant !== null);
    
        // Restructure response format
        const response: ParticipantCotResponse = {
            cot: {
                id: participantCot.id,
                startDate: participantCot.startDate,
                endDate: participantCot.endDate,
                trainingLocation: participantCot.trainingLocation,
                theoryInstructorRegGse: participantCot.theoryInstructorRegGse,
                theoryInstructorCompetency: participantCot.theoryInstructorCompetency,
                practicalInstructor1: participantCot.practicalInstructor1,
                practicalInstructor2: participantCot.practicalInstructor2,
                totalParticipants: totalParticipants,
                status: participantCot.status,
                capability: participantCot.capabilityCots[0].capability,
                participants: {
                    data: participants,
                    paging: {
                        currentPage: request.page,
                        totalPage: totalPage,
                        size: request.size,
                    },
                    actions: {
                        canPrint: true,
                        canDelete: true,
                        canView: true,
                    }
                }
            },
        };
    
        return response;
    }

    async deleteParticipantFromCot(participantId: string, cotId: string): Promise<string> {
        const deletedParticipantFromCot = await this.prismaService.participantsCOT.deleteMany({
            where: {
                AND: [
                    { participantId: { not: null, equals: participantId } },
                    { cotId: cotId }
                ]
            }
        });

        // Jika tidak ada data yang dihapus
        if (deletedParticipantFromCot.count === 0) {
            throw new HttpException('Data tidak ditemukan', 404);
        }

        return 'Participant berhasil dihapus dari COT';
    }
}