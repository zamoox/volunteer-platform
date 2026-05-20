import { InputType, Field } from '@nestjs/graphql';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';

@InputType()
export class UploadDocumentsInput {
  @Field(() => GraphQLUpload, { description: 'Скан-копія витягу з ЄДР' })
  registration!: Promise<FileUpload>;

  @Field(() => GraphQLUpload, { description: 'Скан-копія статуту організації' })
  statute!: Promise<FileUpload>;
}