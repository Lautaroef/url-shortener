import { IsString, IsOptional, IsUrl, MaxLength, Matches } from 'class-validator';

export class CreateUrlDto {
  @IsUrl({}, { message: 'Please provide a valid URL' })
  originalUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Custom slug can only contain letters, numbers, hyphens, and underscores',
  })
  customSlug?: string;
}