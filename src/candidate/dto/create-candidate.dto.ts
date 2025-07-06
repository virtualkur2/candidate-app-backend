import { IsString, IsNotEmpty } from "class-validator";

export class CreateCandidateDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    surname: string;
}