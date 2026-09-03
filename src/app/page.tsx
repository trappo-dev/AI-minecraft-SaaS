import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingNav } from '@/components/layout/landing-nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Zap, Puzzle, FileCode2, Shield, Clock, Download,
  ChevronRight, Star, Code2, Settings2, Globe
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'TrappolaGIoDev – AI Minecraft Plugin & Config Generator',
  description: 'Crea Plugin e Configurazioni per Minecraft in pochi secondi con l\'Intelligenza Artificiale. Supporta Spigot, PaperMC e BungeeCord.',
}

const features = [
  {
    icon: Puzzle,
    title: 'Plugin Java Generator',
    description: 'Genera plugin Spigot/PaperMC completamente funzionali scritti in Java. Basta descrivere cosa vuoi.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    cost: '5 crediti',
  },
  {
    icon: FileCode2,
    title: 'Config YAML Generator',
    description: 'Ottieni configurazioni YAML perfette per qualsiasi plugin. Personalizzate per la tua versione di MC.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    cost: '1 credito',
  },
  {
    icon: Download,
    title: 'Download Diretto',
    description: 'Scarica il codice generato come file .java o .yml in un clic. Pronto all\'uso sul tuo server.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    cost: '',
  },
  {
    icon: Clock,
    title: 'Generazione Istantanea',
    description: 'Output in streaming in tempo reale. Nessuna attesa, vedi il codice apparire riga per riga.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    cost: '',
  },
  {
    icon: Shield,
    title: 'Powered by Claude & GPT-4o',
    description: 'I migliori modelli AI del mondo (via OpenRouter) per codice Minecraft di alta qualità.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    cost: '',
  },
  {
    icon: Globe,
    title: 'Multi-versione',
    description: 'Supporto per Minecraft 1.8 → 1.21. Specifica la versione target e l\'API (Spigot, Paper, Bungee).',
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
    cost: '',
  },
]

const codeExample = `@EventHandler
public void onPlayerJoin(PlayerJoinEvent e) {
    Player player = e.getPlayer();
    // Personalizza il messaggio di benvenuto
    String msg = ChatColor.GREEN + "✦ Benvenuto, " 
      + ChatColor.YELLOW + player.getName() 
      + ChatColor.GREEN + "!";
    player.sendMessage(msg);
    // Effetti visivi
    player.playSound(player.getLocation(),
      Sound.ENTITY_PLAYER_LEVELUP, 1f, 1f);
    player.spawnParticle(
      Particle.VILLAGER_HAPPY,
      player.getLocation(), 20);
}`

const configExample = `# EssentialsX Configuration
# Generato da TrappolaGIoDev AI

prefix: '&a[Server]&r'
suffix: ''

# Sistema di protezione mondo
worldguard:
  default-allow-pvp: false
  protected-regions:
    - spawn
    - market

# Spawn principale
spawn:
  location: world, 0, 64, 0
  first-join: true
  respawn: true

# Economy
economy:
  starting-balance: 1000.0
  currency-symbol: '&6⚡'`

const stats = [
  { value: '500+', label: 'Plugin Generati' },
  { value: '2.4k+', label: 'Config Create' },
  { value: '98%', label: 'Tasso Successo' },
  { value: '<2s', label: 'Tempo Medio' },
]

const testimonials = [
  {
    text: 'Ho risparmiato 3 ore di coding in 30 secondi. Il plugin funziona perfettamente sulla 1.20!',
    author: 'Alex_MC',
    role: 'Server Owner',
    stars: 5,
  },
  {
    text: 'Finalmente uno strumento AI che capisce davvero come funziona Spigot. Impressionante.',
    author: 'DevCraft99',
    role: 'Plugin Developer',
    stars: 5,
  },
  {
    text: 'Le config generate sono pulite e ben commentate. Molto meglio di quello che facevo io!',
    author: 'NightOwl_',
    role: 'Server Admin',
    stars: 5,
  },
]

export default function LandingPage() {
  return (
    <>
      <LandingNav />

      {/* ── HERO ─────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-400/5 blur-[100px]" />
          <div className="absolute inset-0 bg-grid opacity-20" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          {/* Announcement badge */}
          <div className="mb-6 inline-flex animate-fade-in-up">
            <Badge className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary hover:bg-primary/15 transition-colors cursor-default">
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              Powered by Claude 3.5 Sonnet & GPT-4o
            </Badge>
          </div>

          {/* Main headline */}
          <h1
            className="animate-fade-in-up text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]"
            style={{ animationDelay: '0.1s' }}
          >
            Crea Plugin e Config{' '}
            <br className="hidden sm:block" />
            <span className="neon-text text-glow">Minecraft</span> con l&apos;AI
          </h1>

          {/* Subheadline */}
          <p
            className="animate-fade-in-up mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            style={{ animationDelay: '0.2s' }}
          >
            Descrivi il plugin che vuoi, seleziona la versione di Minecraft e la tua API preferita.{' '}
            <strong className="text-foreground">TrappolaGIoDev AI</strong> genera il codice Java o YAML in pochi secondi.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-in-up mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ animationDelay: '0.3s' }}
          >
            <Link href="/auth/register">
              <Button size="lg" className="glow-neon text-base px-8 py-6 font-bold h-auto">
                Inizia Gratis — 10 Crediti
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/#demo">
              <Button variant="outline" size="lg" className="text-base px-8 py-6 h-auto border-border hover:border-primary/40">
                <Code2 className="mr-2 h-5 w-5" />
                Vedi la Demo
              </Button>
            </Link>
          </div>

          {/* Trust line */}
          <p
            className="animate-fade-in-up mt-6 text-xs text-muted-foreground"
            style={{ animationDelay: '0.4s' }}
          >
            Nessuna carta di credito richiesta · Gratis per sempre con 10 crediti
          </p>

          {/* Stats */}
          <div
            className="animate-fade-in-up mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8"
            style={{ animationDelay: '0.5s' }}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold neon-text">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CODE DEMO ─────────────────────────── */}
      <section id="demo" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <Badge className="mb-4 border-primary/20 bg-primary/5 text-primary">
              Output Reale
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Vedi cosa genera l&apos;AI
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Ecco esempi reali di codice generato da TrappolaGIoDev. Pulito, commentato, pronto all&apos;uso.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plugin example */}
            <div className="gradient-border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 bg-card/80 px-4 py-3 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/60" />
                  <div className="h-3 w-3 rounded-full bg-primary/60" />
                </div>
                <span className="ml-2 text-xs text-muted-foreground font-mono">WelcomePlugin.java</span>
                <Badge className="ml-auto text-xs bg-primary/10 text-primary border-primary/20">Plugin</Badge>
              </div>
              <pre className="bg-card/50 p-5 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
                <code>{codeExample}</code>
              </pre>
            </div>

            {/* Config example */}
            <div className="gradient-border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 bg-card/80 px-4 py-3 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/60" />
                  <div className="h-3 w-3 rounded-full bg-primary/60" />
                </div>
                <span className="ml-2 text-xs text-muted-foreground font-mono">config.yml</span>
                <Badge className="ml-auto text-xs bg-cyan-400/10 text-cyan-400 border-cyan-400/20">Config</Badge>
              </div>
              <pre className="bg-card/50 p-5 text-xs font-mono text-cyan-300/90 overflow-x-auto leading-relaxed">
                <code>{configExample}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 border-primary/20 bg-primary/5 text-primary">
              Funzionalità
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Tutto ciò di cui hai bisogno
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Strumenti AI progettati specificamente per lo sviluppo Minecraft, non generici.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass-card rounded-2xl p-6 group hover:border-border/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-sm">{feature.title}</h3>
                  {feature.cost && (
                    <Badge className={`text-xs shrink-0 ml-2 ${feature.color} bg-transparent border-current/30`}>
                      {feature.cost}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-transparent pointer-events-none" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <Badge className="mb-4 border-primary/20 bg-primary/5 text-primary">
              Recensioni
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Amato dalla community
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.author} className="glass-card rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {t.author[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 border-primary/20 bg-primary/5 text-primary">
              Come Funziona
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              3 step per il tuo plugin
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Settings2,
                title: 'Descrivi cosa vuoi',
                desc: 'Spiega il tuo plugin in italiano o inglese. Indica versione MC e API (Spigot/Paper).',
              },
              {
                step: '02',
                icon: Zap,
                title: "L'AI genera il codice",
                desc: 'Claude o GPT-4o scrive il codice Java o YAML in streaming, visibile in tempo reale.',
              },
              {
                step: '03',
                icon: Download,
                title: 'Scarica e usa',
                desc: 'Copia il codice o scarica il file. Caricalo sul tuo server e il gioco è fatto.',
              },
            ].map((step, i) => (
              <div key={step.step} className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                  <step.icon className="h-7 w-7 text-primary" />
                  <span className="absolute -top-2 -right-2 text-xs font-bold text-primary bg-background border border-primary/30 rounded-full w-5 h-5 flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ───────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-6 leading-tight">
            Pronto a creare il tuo{' '}
            <span className="neon-text text-glow">primo plugin?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Unisciti a centinaia di server owner e sviluppatori che usano TrappolaGIoDev ogni giorno.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="glow-neon text-base px-10 py-6 font-bold h-auto animate-pulse-neon">
              Inizia Gratis Ora
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-xs text-muted-foreground">
            10 crediti gratis · Nessuna carta richiesta
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────── */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">
              Trappola<span className="neon-text">GIoDev</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 TrappolaGIoDev. Tutti i diritti riservati.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Termini</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Prezzi</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
