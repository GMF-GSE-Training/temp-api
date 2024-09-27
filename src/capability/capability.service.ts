import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CapabilityResponse, CreateCapability } from "src/model/capability.model";
import { CapabilityValidation } from "./capability.validation";

@Injectable()
export class CapabilityService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly validationService: ValidationService,
    ) { }

    async createCapability(request: CreateCapability): Promise<CapabilityResponse> {
        const createCapabilityRequest = this.validationService.validate(CapabilityValidation.CREATE, request);

        const capability = await this.prismaService.capability.create({
            data: createCapabilityRequest,
        });

        return capability;
    }
}