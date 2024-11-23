import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CotResponse, CreateCot, UpdateCot } from "src/model/cot.model";
import { CotValidation } from "./cot.validation";
import { ActionAccessRights, ListRequest, Paging, SearchRequest } from "src/model/web.model";
import { CurrentUserRequest } from "src/model/auth.model";
import { CoreHelper } from "src/shared/helpers/core.helper";

@Injectable()
export class CotService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly validationService: ValidationService,
        private readonly coreHelper: CoreHelper,
    ) { }

    async createCot(request: CreateCot): Promise<string> {
        request.startDate = new Date(request.startDate);
        request.endDate = new Date(request.endDate);

        const { capabilityId, ...createCotData } = this.validationService.validate(CotValidation.CREATE, request);

        const createCot = await this.prismaService.cOT.create({
            data: createCotData
        });

        if(createCot) {
            await this.prismaService.capabilityCOT.create({
                data: {
                    cotId: createCot.id,
                    capabilityId: capabilityId
                }
            });

            await this.prismaService.participantsCOT.create({
                data: {
                    cotId: createCot.id,
                    participantId: undefined // karena belum ada participant
                }
            });
        };

        return 'Cot berhasil dibuat';
    }

    async getCot(cotId: string): Promise<CotResponse> {
        const cot = await this.prismaService.cOT.findUnique({
            where: {
                id: cotId
            },
            include: {
                capabilityCots: {
                    select: {
                        capability: {
                            select: {
                                id: true,
                                ratingCode: true,
                                trainingName: true,
                            }
                        }
                    }
                }
            }
        });

        if(!cot) {
            throw new HttpException('Cot Tidak ditemukan', 404);
        }

        // Mapping hasil query ke bentuk CotResponse
        const cotResponse: CotResponse = {
            id: cot.id,
            startDate: cot.startDate,
            endDate: cot.endDate,
            trainingLocation: cot.trainingLocation,
            theoryInstructorRegGse: cot.theoryInstructorRegGse,
            theoryInstructorCompetency: cot.theoryInstructorCompetency,
            practicalInstructor1: cot.practicalInstructor1,
            practicalInstructor2: cot.practicalInstructor2,
            status: cot.status,
            Capability: cot.capabilityCots[0]?.capability || null, // Ambil elemen pertama dari array
        };

        return cotResponse;
    }

    async updateCot(cotId: string, request: UpdateCot): Promise<string> {
        const updateCotRequest = this.validationService.validate(CotValidation.UPDATE, request);
        const cot = await this.prismaService.cOT.findUnique({
            where: {
                id: cotId
            },
            include: {
                capabilityCots: true
            }
        });

        if(!cot) {
            throw new HttpException('COT tidak ditemukan', 404);
        }

        // Pisahkan data untuk tabel COT dan relasi CapabilityCOT
        const { capabilityId, ...cotData } = updateCotRequest;

         // Persiapkan transaksi untuk memastikan atomicity
        return await this.prismaService.$transaction(async (prisma) => {
            // 1. Update data COT
            await prisma.cOT.update({
                where: {
                    id: cotId
                },
                data: {
                    ...cotData,
                    // Jika ada capabilityId, update relasi CapabilityCOT
                    ...(capabilityId && {
                        capabilityCots: {
                            // Hapus relasi yang ada
                            deleteMany: {
                                cotId: cotId
                            },
                            // Buat relasi baru
                            create: {
                                capabilityId: capabilityId
                            }
                        }
                    })
                }
            });

            return 'COT berhasil diperbarui';
        });
    }

    // async searchCot(request: SearchRequest, user: CurrentUserRequest): Promise<{ data: any[], actions: ActionAccessRights, paging: Paging }> {
    //     const searchRequest = this.validationService.validate(CotValidation.SEARCH, request);

    //     const cot = await this.prismaService.cOT.findMany({
    //         include: {
    //             capabilities: {
    //                 select: {
    //                     Capability: true
    //                 }
    //             }
    //         }
    //     });
    //     const query = searchRequest.searchQuery.toLowerCase();

    //     let filteredCot = cot;
    //     if(searchRequest.searchQuery) {
    //         // filteredCot = cot.filter(cot => 
    //         //     cot.Capability.kodeTraining.toLowerCase().includes(query) ||
    //         //     cot.Capability.trainingName.toLowerCase().includes(query)
    //         // );
    //     }

    //     const tottalCot = filteredCot.length;
    //     const totalPage = Math.ceil(tottalCot / searchRequest.size);
    //     const paginatedCot = filteredCot.slice(
    //         (searchRequest.page - 1) * searchRequest.size,
    //         searchRequest.page * searchRequest.size
    //     );

    //     const userWithRole = await this.userWithRole(user.user.id);
    //     const userRole = userWithRole.role.role.toLowerCase();
    //     const actions = this.validateActions(userRole);

    //     return {
    //         data: paginatedCot.map(cot => cot),
    //         actions: actions,
    //         paging: {
    //             currentPage: searchRequest.page,
    //             totalPage: totalPage,
    //             size: searchRequest.size,
    //         }
    //     }
    // }

    // async getUnregisteredParticipants(cotId: string, request: ListRequest): Promise<{ data: any[], paging: Paging }> {
    //     // Ambil total count terpisah
    //     const totalParticipants = await this.prismaService.participant.count({
    //         where: {
    //             NOT: {
    //                 ParticipantsCOT: {
    //                     some: {
    //                         cotId: cotId
    //                     }
    //                 }
    //             }
    //         }
    //     });
    
    //     // Ambil data dengan skip dan take
    //     const participants = await this.prismaService.participant.findMany({
    //         where: {
    //             NOT: {
    //                 ParticipantsCOT: {
    //                     some: {
    //                         cotId: cotId
    //                     }
    //                 }
    //             }
    //         },
    //         select: {
    //             id: true,
    //             idNumber: true,
    //             name: true,
    //             dinas: true,
    //             bidang: true,
    //             company: true
    //         },
    //         skip: (request.page - 1) * request.size,
    //         take: request.size
    //     });
    
    //     const totalPage = Math.ceil(totalParticipants / request.size);
    
    //     if (participants.length === 0) {
    //         throw new HttpException("Data tidak ditemukan", 404);
    //     }

    //     return {
    //         data: participants,
    //         paging: {
    //             currentPage: request.page,
    //             totalPage: totalPage,
    //             size: request.size,
    //         },
    //     };
    // }

    // async addParticipantToCot(cotId: string, participantIds: string[]): Promise<string> {
    //     if (!Array.isArray(participantIds) || participantIds.length === 0) {
    //         throw new HttpException('Request format tidak valid. participantIds harus berupa array.', 400);
    //     }
    
    //     const cot = await this.prismaService.cOT.findUnique({
    //         where: { id: cotId },
    //     });
    
    //     if (!cot) {
    //         throw new HttpException('COT tidak ditemukan', 404);
    //     }
    
    //     const participants = await this.prismaService.participant.findMany({
    //         where: {
    //             id: { in: participantIds },
    //         },
    //     });

    //     const validParticipantIds = participants.map(p => p.id);

    //     // Filter hanya ID yang valid
    //     if (validParticipantIds.length === 0) {
    //         throw new HttpException('Tidak ada participant yang valid ditemukan', 404);
    //     }

    //     const existingParticipants = await this.prismaService.participantsCOT.findMany({
    //         where: {
    //             cotId,
    //             participantId: { in: validParticipantIds },
    //         },
    //     });
    
    //     const existingParticipantIds = existingParticipants.map(p => p.participantId);
    //     const newParticipantIds = validParticipantIds.filter(id => !existingParticipantIds.includes(id));
    
    //     if (newParticipantIds.length === 0) {
    //         throw new HttpException('Semua participant yang valid sudah terdaftar di COT ini', 400);
    //     }
    
    //     const participantData = newParticipantIds.map(participantId => ({
    //         participantId,
    //         cotId,
    //     }));
    
    //     await this.prismaService.participantsCOT.createMany({
    //         data: participantData,
    //     });
    
    //     return `${newParticipantIds.length} participant berhasil ditambahkan`;
    // }

    // async getParticipantsCot(cotId: string, request: ListRequest): Promise<any> {
    //     const participantCot = await this.prismaService.participantsCOT.findMany({
    //         where: {
    //             cotId: cotId
    //         },
    //         select: {
    //             cot: {
    //                 include: {
    //                     capabilities: {
    //                         select:{
    //                             Capability: {
    //                                 select: {
    //                                     ratingCode: true,
    //                                     trainingName: true
    //                                 }
    //                             }
    //                         }
    //                     }
    //                 }
    //             },
    //             participant: {
    //                 select: {
    //                     id: true,
    //                     noPegawai: true,
    //                     nama: true,
    //                     dinas: true,
    //                     simBFileName: true,
    //                     tglKeluarSuratSehatButaWarna: true,
    //                     tglKeluarSuratBebasNarkoba: true,
    //                 }
    //             },
    //         }
    //     });

    //     // Transformasi data untuk `cot`
    //     const transformedCot = participantCot.length > 0 ? participantCot[0].cot : null;

    //     // Ambil data `participant` dan hitung total
    //     const totalParticipants = participantCot.length;
    //     const totalPage = Math.ceil(totalParticipants / request.size);

    //     // Slice data `participant` berdasarkan `page` dan `size`
    //     const startIndex = (request.page - 1) * request.size;
    //     const endIndex = startIndex + request.size;
    //     const paginatedParticipants = participantCot.slice(startIndex, endIndex).map(item => item.participant);

    //     return {
    //         data: {
    //             cotId: cotId,
    //             cot: transformedCot,
    //             participant: paginatedParticipants,
    //             actions: {
    //                 canEdit: false,
    //                 canDelete: true,
    //                 canView: true,
    //                 canPrint: true,
    //             },
    //             paging: {
    //                 currentPage: request.page,
    //                 totalPage: totalPage,
    //                 size: request.size,
    //                 totalItems: totalParticipants,
    //             },
    //         }
    //     };
    // }

    // async deleteParticipantFromCot(participantId: string, cotId: string): Promise<string> {
    //     const deletedParticipant = await this.prismaService.participantsCOT.deleteMany({
    //         where: {
    //             AND: [
    //                 { participantId: { not: null, equals: participantId } },
    //                 { cotId: cotId }
    //             ]
    //         }
    //     });

    //     // Jika tidak ada data yang dihapus
    //     if (deletedParticipant.count === 0) {
    //         throw new HttpException('Participant tidak ditemukan dalam COT tersebut', 404);
    //     }

    //     return 'Participant berhasil dihapus dari COT';
    // }

    async deleteCot(cotId: string): Promise<string> {
        const cot = await this.prismaService.cOT.findUnique({
            where : {
                id: cotId
            },
        });

        if(!cot) {
            throw new HttpException('COT tidak ditemukan', 404);
        }

        await this.prismaService.$transaction(async (prisma) => {
            // Hapus peserta terkait
            await prisma.participantsCOT.deleteMany({
                where: { cotId: cot.id },
            });
        
            // Hapus kemampuan terkait
            await prisma.capabilityCOT.deleteMany({
                where: { cotId: cot.id },
            });
        
            // Hapus COT
            await prisma.cOT.delete({
                where: { id: cot.id },
            });
        });        

        return 'Berhasil menghapus COT';
    }

    async listCot(user: CurrentUserRequest, request: ListRequest): Promise<{ data: CotResponse[], actions: ActionAccessRights, paging: Paging }> {
        const cot = await this.prismaService.cOT.findMany({
            include: {
                capabilityCots: {
                    select: {
                        capability: {
                            select: {
                                ratingCode: true,
                                trainingName: true,
                            }
                        }
                    }
                }
            }
        });

        // Mapping hasil query ke bentuk CotResponse
        const cotResponses: CotResponse[] = cot.map(item => ({
            id: item.id,
            startDate: item.startDate,
            endDate: item.endDate,
            trainingLocation: item.trainingLocation,
            theoryInstructorRegGse: item.theoryInstructorRegGse,
            theoryInstructorCompetency: item.theoryInstructorCompetency,
            practicalInstructor1: item.practicalInstructor1,
            practicalInstructor2: item.practicalInstructor2,
            status: item.status,
            Capability: item.capabilityCots[0]?.capability ? {
                ratingCode: item.capabilityCots[0].capability.ratingCode,
                trainingName: item.capabilityCots[0].capability.trainingName,
            } : undefined,
        }));

        const totalCot = cotResponses.length;
        const totalPage = Math.ceil(totalCot / request.size);
        const paginateCot = cotResponses.slice(
            (request.page - 1) * request.size,
            request.page * request.size
        );

        const userWithRole = await this.coreHelper.userWithRole(user.user.id);
        const userRole = userWithRole.role.name.toLowerCase();
        const actions = this.validateActions(userRole);

        return {
            data: paginateCot,
            actions: actions,
            paging: {
                currentPage: request.page,
                totalPage: totalPage,
                size: request.size,
            },
        };
    }

    private validateActions(userRole: string): ActionAccessRights {
        const accessMap = {
            'super admin': { canEdit: true, canDelete: true, canView: true },
            'supervisor': { canEdit: false, canDelete: false, canView: true },
            'lcu': { canEdit: false, canDelete: false, canView: true },
            'user': { canEdit: false, canDelete: false, canView: true },
        }

        return this.coreHelper.validateActions(userRole, accessMap);
    }
}