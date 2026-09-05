"use client";

import * as React from "react";
import { useEffect, useState, useTransition, Suspense } from "react";
import Link from "next/link";
import {
  useRouter,
  useSearchParams,
  useParams,
  usePathname,
} from "next/navigation";
import {
  Search,
  Globe,
  Menu,
  Film,
  MapPin,
  Popcorn,
  Ticket,
  Sparkles,
  CalendarDays,
  X,
} from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ModeToggle } from "./ModeToggle";
import { LanguageToggle } from "./LanguageToggle";

function NavbarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const pathname = usePathname();
  const lang = (params?.lang as string) || "pt";
  const [, startTransition] = useTransition();

  const [isScrolled, setIsScrolled] = useState(false);
  const [searchVal, setSearchVal] = useState(searchParams.get("search") ?? "");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const currentBranch = searchParams.get("branch");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchChange = (term: string) => {
    setSearchVal(term);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams.toString());
      if (term) {
        newParams.set("search", term);
      } else {
        newParams.delete("search");
      }

      startTransition(() => {
        router.push(`/${lang}/movies?${newParams.toString()}`);
      });
    }, 500);
  };

  return (
    <header
      className={`fixed z-50 w-full transition-all duration-500 ${
        isScrolled
          ? "bg-background/85 backdrop-blur-xl shadow-lg border-b border-border/40"
          : "bg-linear-to-b from-background/90 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 transition-all duration-500 w-full md:max-w-7xl">
        {/* Esquerda: Logo & Pesquisa */}
        <div className="flex items-center gap-2 sm:gap-6 flex-1 max-w-xl">
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-foreground hover:bg-muted rounded-full transition-colors"
            aria-label="Abrir Menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link
            href={`/${lang}`}
            className="flex items-center gap-2 shrink-0 transition-transform hover:scale-[1.02]"
            onClick={() => setMenuOpen(false)}
          >
            <Image
              src="/logo.png"
              alt="Cinema"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="font-display font-extrabold text-xl tracking-wider text-foreground hidden sm:inline-block">
              CINEMA
            </span>
          </Link>

          {/* Input de Busca de Filmes */}
          <div className="relative w-full hidden md:block max-w-xs lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="movie-search"
              autoComplete="off"
              value={searchVal}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Pesquisar filmes, atores, salas..."
              className="h-9 w-full rounded-full border border-border bg-background/60 pl-9 pr-4 text-xs outline-none focus:border-primary focus:bg-background transition-all"
            />
          </div>
        </div>

        {/* Centro: Menu de Navegação */}
        <nav className="hidden lg:flex items-center justify-center">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              {/* Menu Filmes & Programação */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-xs font-medium">
                  Programação
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[420px] lg:w-[520px] lg:grid-cols-[.9fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink
                        href={`/${lang}/movies`}
                        className="flex h-full w-full flex-col justify-end rounded-md p-6 no-underline outline-none focus:shadow-md transition-all select-none cursor-pointer bg-gradient-to-br from-primary/90 to-primary text-primary-foreground hover:opacity-95"
                      >
                        <Film className="h-8 w-8 mb-2" />
                        <div className="text-base font-bold">Filmes</div>
                        <p className="text-xs leading-relaxed opacity-90 mt-1">
                          Consulte os horários atualizados e garanta os melhores
                          lugares nas nossas salas.
                        </p>
                      </NavigationMenuLink>
                    </li>
                    <ListItem
                      href={`/${lang}/movies?status=em-cartaz`}
                      title="Em Cartaz"
                      icon={<Film className="h-3.5 w-3.5 text-emerald-500" />}
                    >
                      Filmes em exibição hoje nas nossas salas.
                    </ListItem>
                    <ListItem
                      href={`/${lang}/movies?status=brevemente`}
                      title="Em Breve & Pré-Venda"
                      icon={
                        <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
                      }
                    >
                      As próximas estreias e pré-vendas exclusivas.
                    </ListItem>
                    <ListItem
                      href={`/${lang}/experiencias`}
                      title="Salas VIP & 3D"
                      icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
                    >
                      Descubra o conforto e luxo das salas VIP.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Menu Cinemas / Localizações */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-xs font-medium">
                  Cinemas
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  {/* <ul className="grid w-[520px] gap-2 p-4 md:grid-cols-2 lg:w-[600px]">
                    {locations.map((b) => (
                      <ListItem
                        key={b.id}
                        href={`/${lang}/cinemas/${b.id}`}
                        title={b.name}
                        icon={<MapPin className="h-3.5 w-3.5 text-primary" />}
                        className={
                          currentBranch === b.id
                            ? "bg-accent/60 border-l-2 border-primary"
                            : ""
                        }
                      >
                        <span className="block font-semibold text-[11px] text-foreground/80 mb-0.5">
                          {b.address || `${b.city}, ${b.province}`}
                        </span>
                        {b.phone ? `Telf: ${b.phone}` : "O seu cinema de eleição."}
                      </ListItem>
                    ))}
                  </ul> */}
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Menu Bar / Pipocas */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  href={`/${lang}/bar`}
                  className={`${navigationMenuTriggerStyle()} text-xs font-medium gap-1.5`}
                >
                  <Popcorn className="h-3.5 w-3.5 text-amber-500" />
                  Bar & Pipocas
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Área de Imersão */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  href={`/${lang}/immersion`}
                  className={`${navigationMenuTriggerStyle()} text-xs font-medium gap-1.5`}
                >
                  Imersão 3D
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Direita: Idioma, Tema e Ação Principal */}
        <div className="flex items-center gap-3 justify-end flex-1">
          <ModeToggle />
          <LanguageToggle />

          {/* Botão de Pesquisa (Mobile) */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden flex items-center justify-center p-2 rounded-full hover:bg-muted text-foreground transition-colors"
            aria-label="Pesquisar"
          >
            <Search className="h-[1.1rem] w-[1.1rem]" />
          </button>
        </div>
      </div>
      <div className="dot-divider" />

      {/* ───────────────────────────────────────────────────────── */}
      {/* Mobile Search Sidebar */}
      {/* ───────────────────────────────────────────────────────── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSearchOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-[70] w-full max-w-sm bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col p-6 ${
          searchOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-foreground">Pesquisar</h3>
          <button
            onClick={() => setSearchOpen(false)}
            className="p-2 bg-muted hover:bg-muted/80 rounded-full transition-colors text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            name="movie-search-mobile"
            autoComplete="off"
            value={searchVal}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Pesquisar filmes..."
            className="h-12 w-full rounded-xl border border-border bg-background/60 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>
      </aside>
      {/* ───────────────────────────────────────────────────────── */}
      {/* Mobile Navigation Sidebar */}
      {/* ───────────────────────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] w-full max-w-sm bg-background border-r border-border shadow-2xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col p-6 overflow-y-auto ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/${lang}`}
            className="flex items-center gap-2"
            onClick={() => setMenuOpen(false)}
          >
            <Image
              src="/logo.png"
              alt="Cinema"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="font-display font-extrabold text-xl tracking-wider text-foreground">
              CINEMA
            </span>
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 bg-muted hover:bg-muted/80 rounded-full transition-colors text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-6">
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Film className="h-4 w-4" /> Programação
            </h4>
            <ul className="space-y-1">
              <li>
                <Link
                  href={`/${lang}/movies`}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cartaz da Semana
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/movies?status=em-cartaz`}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Em Cartaz
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/movies?status=brevemente`}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Em Breve & Pré-Venda
                </Link>
              </li>
            </ul>
          </section>

          <section className="border-t pt-5 border-border/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Cinemas
            </h4>
            {/* <ul className="space-y-1">
              {locations.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/${lang}/cinemas/${b.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul> */}
          </section>

          <section className="border-t pt-5 border-border/50">
            <ul className="space-y-1">
              <li>
                <Link
                  href={`/${lang}/bar`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  <Popcorn className="h-4 w-4 text-amber-500" />
                  Bar & Pipocas
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/experiencias`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Salas VIP & Experiências
                </Link>
              </li>
            </ul>
          </section>
        </nav>
      </aside>
    </header>
  );
}

// Wrapper com Suspense
export function Navbar() {
  return (
    <Suspense
      fallback={
        <div className="fixed top-0 left-0 h-16 w-full bg-background/20 backdrop-blur" />
      }
    >
      <NavbarContent />
    </Suspense>
  );
}

interface ListItemProps extends React.ComponentPropsWithoutRef<"a"> {
  title: string;
  icon?: React.ReactNode;
}

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
  ({ className, title, children, href, icon, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink
          href={href || "#"}
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-2.5 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer",
            className,
          )}
          {...props}
        >
          <div className="flex items-center gap-2 text-xs font-bold leading-none text-foreground">
            {icon}
            {title}
          </div>
          <div className="line-clamp-2 text-xs mt-1 leading-snug text-muted-foreground">
            {children}
          </div>
        </NavigationMenuLink>
      </li>
    );
  },
);
ListItem.displayName = "ListItem";
