CREATE TABLE "hydraulic_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"type" varchar(20) DEFAULT 'PV' NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"invert_elevation" double precision NOT NULL,
	"terrain_elevation" double precision,
	"angle" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"contractor" varchar(200),
	"technical_manager" varchar(200),
	"original_dxf" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"upstream_node_id" uuid NOT NULL,
	"downstream_node_id" uuid NOT NULL,
	"length" double precision NOT NULL,
	"slope" double precision NOT NULL,
	"upstream_invert" double precision NOT NULL,
	"downstream_invert" double precision NOT NULL,
	"pavement_type" varchar(100),
	"diameter" double precision,
	"material" varchar(50),
	"manning" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hydraulic_nodes" ADD CONSTRAINT "hydraulic_nodes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segments" ADD CONSTRAINT "segments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segments" ADD CONSTRAINT "segments_upstream_node_id_hydraulic_nodes_id_fk" FOREIGN KEY ("upstream_node_id") REFERENCES "public"."hydraulic_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segments" ADD CONSTRAINT "segments_downstream_node_id_hydraulic_nodes_id_fk" FOREIGN KEY ("downstream_node_id") REFERENCES "public"."hydraulic_nodes"("id") ON DELETE no action ON UPDATE no action;