import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { AssetModule } from '@/asset/asset.module';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EmailModule } from '@/email/email.module';
import { EventModule } from '@/event/event.module';
import { FormPrivateController } from '@/form/controllers/form.private.controller';
import { FormPublicController } from '@/form/controllers/form.public.controller';
import { FormService } from '@/form/form.service';
import { FormRepository } from '@/form/repository/form.repository';
import { MembersModule } from '@/members/members.module';
import { MembersService } from '@/members/service/members.service';

@Module({
  imports: [
    AssetModule,
    CacheModule.register(),
    MembersModule,
    EmailModule,
    EventModule,
  ],
  controllers: [FormPrivateController, FormPublicController],
  providers:   [
    FormService,
    FormRepository,
    PrismaService,
    MembersService,
  ],
  exports: [FormService, FormRepository],
})
export class FormModule {
}
