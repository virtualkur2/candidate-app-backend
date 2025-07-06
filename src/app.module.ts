import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CandidateModule } from './candidate/candidate.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    CandidateModule,
    MulterModule.register({
      dest: './uploads'
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
