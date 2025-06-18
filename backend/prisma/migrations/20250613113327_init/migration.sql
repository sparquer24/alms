-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleHierarchy" (
    "id" SERIAL NOT NULL,
    "from_role_id" INTEGER NOT NULL,
    "to_role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleHierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "designation" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "last_assigned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "applicant_name" TEXT NOT NULL,
    "applicant_mobile" TEXT NOT NULL,
    "applicant_email" TEXT,
    "father_name" TEXT,
    "gender" TEXT,
    "dob" TIMESTAMP(3),
    "address" TEXT,
    "application_type" TEXT NOT NULL,
    "weapon_type" TEXT,
    "weapon_reason" TEXT,
    "license_type" TEXT,
    "license_validity" TIMESTAMP(3),
    "is_previously_held_license" BOOLEAN NOT NULL DEFAULT false,
    "previous_license_number" TEXT,
    "has_criminal_record" BOOLEAN NOT NULL DEFAULT false,
    "criminal_record_details" TEXT,
    "flow_status_id" INTEGER,
    "assigned_to_id" INTEGER,
    "forwarded_from_id" INTEGER,
    "forwarded_to_id" INTEGER,
    "forward_comments" TEXT,
    "return_reason" TEXT,
    "flag_reason" TEXT,
    "disposal_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationFlow" (
    "id" SERIAL NOT NULL,
    "application_id" TEXT NOT NULL,
    "flow_status_id" INTEGER NOT NULL,
    "action_taken" TEXT NOT NULL,
    "remarks" TEXT,
    "document_url" TEXT,
    "acted_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowStatusMapping" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "from_role" TEXT NOT NULL,
    "to_role" TEXT,
    "application_state" TEXT NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT true,
    "can_forward" BOOLEAN NOT NULL DEFAULT false,
    "can_approve" BOOLEAN NOT NULL DEFAULT false,
    "can_reject" BOOLEAN NOT NULL DEFAULT false,
    "can_re_enquire" BOOLEAN NOT NULL DEFAULT false,
    "can_flag" BOOLEAN NOT NULL DEFAULT false,
    "can_generate_proceedings" BOOLEAN NOT NULL DEFAULT false,
    "can_generate_memo" BOOLEAN NOT NULL DEFAULT false,
    "can_upload_documents" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowStatusMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_id_permission_id_key" ON "RolePermission"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "RoleHierarchy_from_role_id_to_role_id_key" ON "RoleHierarchy"("from_role_id", "to_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FlowStatusMapping_code_key" ON "FlowStatusMapping"("code");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleHierarchy" ADD CONSTRAINT "RoleHierarchy_from_role_id_fkey" FOREIGN KEY ("from_role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleHierarchy" ADD CONSTRAINT "RoleHierarchy_to_role_id_fkey" FOREIGN KEY ("to_role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_flow_status_id_fkey" FOREIGN KEY ("flow_status_id") REFERENCES "FlowStatusMapping"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_forwarded_from_id_fkey" FOREIGN KEY ("forwarded_from_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_forwarded_to_id_fkey" FOREIGN KEY ("forwarded_to_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationFlow" ADD CONSTRAINT "ApplicationFlow_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationFlow" ADD CONSTRAINT "ApplicationFlow_flow_status_id_fkey" FOREIGN KEY ("flow_status_id") REFERENCES "FlowStatusMapping"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationFlow" ADD CONSTRAINT "ApplicationFlow_acted_by_id_fkey" FOREIGN KEY ("acted_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
