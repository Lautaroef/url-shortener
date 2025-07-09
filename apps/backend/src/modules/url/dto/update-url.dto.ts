import { IsString, MaxLength, Matches } from "class-validator";

export class UpdateUrlDto {
  @IsString()
  @MaxLength(12)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: "Slug can only contain letters, numbers, hyphens, and underscores",
  })
  slug: string;
}
