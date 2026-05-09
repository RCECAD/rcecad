export * from "@/domain/entities/example";
export * from "@/domain/entities/example-2";
export * from "@/domain/entities/home-project";
export * from "@/domain/entities/home-project-status";
export * from "@/domain/entities/home-projects-payload";

/*  A cada entity nova, exportar ela aqui, pois ao utilizar as entities em outros lugares,
    
    ao invés de ficar assim:
    import type { Example } from "@/domain/entities/example"

    ficará dessa forma:
    import type {Example, Example2} from "@/domain/entities"

    muito mais limpo né?
*/
