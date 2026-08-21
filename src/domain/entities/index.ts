export * from "@/domain/entities/example";
export * from "@/domain/entities/example-2";
export * from "@/domain/entities/hydraulic-node";
export * from "@/domain/entities/project";
export * from "@/domain/entities/segment";
export * from "@/domain/entities/user";

/*  A cada entity nova, exportar ela aqui, pois ao utilizar as entities em outros lugares,

    ao invés de ficar assim:
    import type { Example } from "@/domain/entities/example"

    ficará dessa forma:
    import type {Example, Example2} from "@/domain/entities"

    muito mais limpo né?
*/
