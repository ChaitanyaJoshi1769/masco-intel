import { IsString, IsNumber, IsOptional, IsArray, IsObject } from 'class-validator';

export class CreateProductDto {
  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  upc?: string;

  @IsOptional()
  @IsString()
  mpn?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  brand: string;

  @IsOptional()
  @IsString()
  collection?: string;

  @IsString()
  productType: string;

  @IsString()
  finish: string;

  @IsOptional()
  @IsString()
  valveType?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsObject()
  specifications?: Record<string, string>;

  @IsOptional()
  @IsArray()
  certifications?: string[];

  @IsOptional()
  @IsString()
  estimatedGrade?: string;
}
