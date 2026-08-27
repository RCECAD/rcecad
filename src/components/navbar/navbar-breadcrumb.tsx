"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, type MouseEvent, useMemo } from "react";
import { useUnsavedChanges } from "@/components/project/unsaved-changes-provider";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItemData {
  href: string;
  label: string;
  current: boolean;
}

const segmentLabels: Record<string, string> = {
  account: "Conta",
  dashboard: "Painel",
  edit: "Editar",
  home: "Home",
  profile: "Perfil",
  project: "Projetos",
  reports: "Relatórios",
  settings: "Configurações",
  overview: "Visão Geral",
  "general-data": "Dados Gerais",
  hydraulics: "Hidráulica",
  flows: "Vazões",
  paving: "Pavimentação",
  sizing: "Dimensionamento",
  validation: "Validação",
  results: "Resultados",
  export: "Exportação",
};

const homeBreadcrumb: BreadcrumbItemData = {
  href: "/home",
  label: segmentLabels.home,
  current: false,
};

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function formatSegmentLabel(segment: string) {
  const normalizedSegment = segment.toLowerCase();
  const translatedLabel = segmentLabels[normalizedSegment];

  if (translatedLabel) {
    return translatedLabel;
  }

  const decodedSegment = decodeSegment(segment).replaceAll(/[-_]+/g, " ");

  return decodedSegment
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (/^\d+$/.test(word) || /^[a-f0-9-]{8,}$/i.test(word)) {
        return word;
      }

      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function buildBreadcrumbItems(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ ...homeBreadcrumb, current: true }];
  }

  const items: Array<BreadcrumbItemData> =
    segments[0]?.toLowerCase() === "home" ? [] : [homeBreadcrumb];

  segments.forEach((segment, index) => {
    items.push({
      href: `/${segments.slice(0, index + 1).join("/")}`,
      label: formatSegmentLabel(segment),
      current: index === segments.length - 1,
    });
  });

  return items;
}

export function NavbarBreadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  const { requestNavigation } = useUnsavedChanges();
  const items = useMemo(() => buildBreadcrumbItems(pathname), [pathname]);

  const handleNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    requestNavigation(() => router.push(href));
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <Fragment key={item.href}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.current ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    href={item.href}
                    onClick={(event) => handleNavigation(event, item.href)}
                  >
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
