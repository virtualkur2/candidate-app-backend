import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsIn } from "class-validator";
import { SeniorityType } from "../domain/seniority.type";

export class CandidateResponseDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    surname: string;

    @IsString()
    @IsIn(['junior', 'senior'])
    seniority: SeniorityType;

    @IsNumber()
    years: number;

    @IsBoolean()
    availability: boolean;
}