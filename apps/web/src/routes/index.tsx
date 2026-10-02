import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Camera,
  Leaf,
  Plus,
  Footprints,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@touch-grass/ui/components/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@touch-grass/ui/components/tabs";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@touch-grass/ui/components/collapsible";
import { Brand } from "@/components/brand";
import { guides } from "@/lib/guides";
import landingCss from "../landing.css?url";
import { ENV } from "../env";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Touch Grass — There's a whole world outside." },
      {
        name: "description",
        content:
          "A pocket field journal for a life a little more outside. Identify trees and plants, collect your discoveries, and get to know the nature around you.",
      },
      {
        property: "og:title",
        content: "Touch Grass — Wonder is right outside.",
      },
      {
        property: "og:description",
        content: "Meet a tree. Learn its name. Keep a little of the outside.",
      },
      {
        property: "og:image",
        content: new URL("/images/touch-grass-social.jpg", ENV.VITE_SERVER_URL)
          .href,
      },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: landingCss }],
  }),
  component: Landing,
});

const discoveries = [
  {
    value: "look",
    label: "01 · Look",
    eyebrow: "A small pause in your day",
    title: "That tree you always walk past?",
    text: "Stop for a moment. Photograph a leaf, the bark, or the whole tree. A few different views tell a better story.",
    note: "Leave the leaf. Take the photograph.",
    image: "/images/woodland-illustration.webp",
    alt: "Illustrated path beneath a spreading oak tree",
    caption: "An ordinary walk. An unexpected discovery.",
  },
  {
    value: "learn",
    label: "02 · Learn",
    eyebrow: "A name is just the beginning",
    title: "Hello, English oak.",
    text: "Get a suggested name and learn which details to look for. Compare the clues, explore possible matches, and let a little curiosity lead the way.",
    note: "AI suggestions, with room for uncertainty.",
    image: "/images/oak-study.webp",
    alt: "Botanical study of rounded oak leaves and acorns",
    caption: "Quercus robur · Leaves, lobes & little clues",
  },
  {
    value: "keep",
    label: "03 · Keep",
    eyebrow: "One page. Then another.",
    title: "The start of a small friendship.",
    text: "Give your discovery a nickname. Keep a note of where you met. Come back in a different season and add another visit to its story.",
    note: "Your photos, places, and notes stay private.",
    image: "/images/oak-study.webp",
    alt: "Oak specimen on a sample journal page",
    caption: "The oak at the bend · A page worth returning to",
  },
] as const;

const questions = [
  {
    question: "Do I need to know anything about plants?",
    answer:
      "Just enough to be curious. Photograph something that catches your eye and we'll help you look closer. You can save a discovery without identifying it, too.",
  },
  {
    question: "How does identification work?",
    answer:
      "Your identification photos are sent to Google Gemini, which suggests a match and features to compare. It can be wrong. Treat each result as a starting point, and never use it to decide whether something is safe to eat or touch.",
  },
  {
    question: "Can I use it on my phone?",
    answer:
      "Yes. Touch Grass works in your browser and can be added to your home screen. On iPhone, open it in Safari and use Share → Add to Home Screen. Other supported browsers offer an install option in the app's Settings.",
  },
  {
    question: "What happens when I lose signal?",
    answer:
      "Once the app is ready for offline use, you can keep photos and notes as drafts on that device. Identification and syncing need a connection. Come back online to finish and save your discovery.",
  },
  {
    question: "Who can see my journal?",
    answer:
      "Your journal, photos, and saved locations are private to your account. Nothing is published to a social feed. Location is optional, and only the photos you submit for identification are sent to the AI service.",
  },
];

function StartJournal({ sun = false }: { sun?: boolean }) {
  return (
    <Button
      variant={sun ? "sun" : "field"}
      nativeButton={false}
      render={<Link to="/login" search={{ mode: "signup" }} />}
    >
      Start your field journal <ArrowUpRight data-icon="inline-end" />
    </Button>
  );
}

function Landing() {
  return (
    <div className="landing">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="landing-header">
        <Brand />
        <nav className="landing-nav" aria-label="Site navigation">
          <a href="#how-it-works">The little idea</a>
          <a href="#field-notes">Field notes</a>
          <a href="#questions">A few questions</a>
        </nav>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to="/login" search={{ mode: "signin" }} />}
        >
          Sign in <ArrowUpRight data-icon="inline-end" />
        </Button>
      </header>
      <main id="main">
        <section className="landing-hero" aria-labelledby="hero-title">
          <img
            className="landing-meadow"
            src="/images/meadow-hero.webp"
            alt="An illustrated wildflower meadow, with a path winding under an old oak into distant hills"
            width={1536}
            height={1024}
            fetchPriority="high"
          />
          <div className="hero-copy">
            <p className="landing-eyebrow">
              <span /> A pocket journal. A world to notice.
            </p>
            <h1 id="hero-title">
              Wonder is
              <br />
              <em>right outside.</em>
            </h1>
            <p>
              Meet a tree. Learn its name.
              <br />
              Keep a little of the outside.
            </p>
            <StartJournal />
            <Link className="hero-preview" to="/explore">
              Or take a little look around <ArrowRight size={13} />
            </Link>
          </div>
          <a
            href="#how-it-works"
            className="hero-scroll"
            aria-label="Discover how Touch Grass works"
          >
            <ArrowDown size={18} />
          </a>
        </section>

        <section id="how-it-works" className="landing-intro landing-section">
          <div className="intro-heading">
            <p className="landing-eyebrow">A little less autopilot</p>
            <h2>
              Turn “just a tree”
              <br />
              into <em>an old friend.</em>
            </h2>
            <p>
              You don’t need a mountain, a weekend away, or the right shoes.
              There’s something worth noticing on your way home.
            </p>
          </div>
          <Tabs defaultValue="learn" className="discovery-demo">
            <div className="demo-navigation">
              <TabsList variant="line" aria-label="Try a sample discovery">
                {discoveries.map((step) => (
                  <TabsTrigger value={step.value} key={step.value}>
                    {step.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <span className="landing-fineprint">A sample discovery</span>
            </div>
            {discoveries.map((step) => (
              <TabsContent
                key={step.value}
                value={step.value}
                className="demo-panel"
              >
                <figure className={`specimen-page specimen-${step.value}`}>
                  <div className="specimen-topline">
                    <span>TOUCH GRASS / FIELD JOURNAL</span>
                    <Leaf size={14} />
                  </div>
                  <img
                    src={step.image}
                    alt={step.alt}
                    width={600}
                    height={600}
                    loading="lazy"
                  />
                  {step.value === "keep" && (
                    <p className="specimen-handnote">
                      The oak at the bend.
                      <br />
                      Same place. A little different every time.
                    </p>
                  )}
                  <figcaption>{step.caption}</figcaption>
                  <span className="specimen-number" aria-hidden="true">
                    No. 001
                  </span>
                </figure>
                <div className="demo-description">
                  <p className="landing-eyebrow">{step.eyebrow}</p>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  <p className="demo-note">
                    <Leaf size={15} />
                    {step.note}
                  </p>
                  <Button
                    variant="link"
                    nativeButton={false}
                    render={<Link to="/capture" />}
                  >
                    Try your first discovery{" "}
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        <section className="landing-keepsake" aria-labelledby="keepsake-title">
          <div className="keepsake-inner landing-section">
            <div
              className="journal-art"
              aria-label="Illustrated field journal with a fern specimen tucked inside"
              role="img"
            >
              <div className="journal-paper">
                <span>NOTES FROM OUTSIDE</span>
                <img
                  src="/images/fern-study.webp"
                  alt=""
                  loading="lazy"
                  width={600}
                  height={600}
                />
                <p>
                  Take your time.
                  <br />
                  There’s plenty to see.
                </p>
              </div>
              <div className="journal-cover">
                <span>
                  A COLLECTION OF
                  <br />
                  SMALL WONDERS
                </span>
                <img
                  src="/images/oak-study.webp"
                  alt=""
                  loading="lazy"
                  width={600}
                  height={600}
                />
                <p>
                  the outside
                  <br />
                  <em>is yours.</em>
                </p>
                <span>
                  TOUCH GRASS
                  <br />
                  YOUR FIELD JOURNAL
                </span>
              </div>
              <span className="journal-bookmark" aria-hidden="true" />
            </div>
            <div className="keepsake-copy">
              <p className="landing-eyebrow">
                For the things you’d usually walk past
              </p>
              <h2 id="keepsake-title">
                A collection
                <br />
                of <em>small wonders.</em>
              </h2>
              <p>
                That lovely leaf. The tree outside your window. The path you
                always mean to take. Give them a place in your pocket.
              </p>
              <ul className="keepsake-list">
                <li>
                  <Camera />
                  <div>
                    <h3>Keep what catches your eye.</h3>
                    <p>Photos, little notes, and names to remember.</p>
                  </div>
                </li>
                <li>
                  <Footprints />
                  <div>
                    <h3>Go back. See what’s changed.</h3>
                    <p>Follow a tree through the seasons, visit by visit.</p>
                  </div>
                </li>
                <li>
                  <LockKeyhole />
                  <div>
                    <h3>A little corner of your own.</h3>
                    <p>A private journal, with no audience to perform for.</p>
                  </div>
                </li>
              </ul>
              <StartJournal sun />
            </div>
          </div>
        </section>

        <section id="field-notes" className="landing-section landing-reading">
          <div className="reading-heading">
            <div>
              <p className="landing-eyebrow">From the field notes</p>
              <h2>
                A few ways
                <br />
                to <em>look closer.</em>
              </h2>
            </div>
            <p>
              Small ideas for your next wander.
              <br />
              Best read with a little fresh air.
            </p>
          </div>
          <div className="landing-guides">
            {guides.map((guide, index) => (
              <Link
                key={guide.slug}
                to="/guide/$slug"
                params={{ slug: guide.slug }}
                className="landing-guide"
              >
                <div className={`guide-art guide-art-${index}`}>
                  <span className="guide-edition">
                    FIELD NOTE / 0{index + 1}
                  </span>
                  <img
                    src={guide.art}
                    alt=""
                    width={600}
                    height={600}
                    loading="lazy"
                  />
                  <ArrowUpRight aria-hidden="true" />
                </div>
                <p className="landing-eyebrow">{guide.time}</p>
                <h3>{guide.title}</h3>
                <p>{guide.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section id="questions" className="landing-section landing-questions">
          <div>
            <p className="landing-eyebrow">Before you wander</p>
            <h2>
              A few
              <br />
              <em>little answers.</em>
            </h2>
            <img
              src="/images/fern-study.webp"
              alt=""
              width={600}
              height={600}
              loading="lazy"
            />
          </div>
          <div className="landing-faq">
            {questions.map((item) => (
              <Collapsible key={item.question}>
                <h3>
                  <CollapsibleTrigger className="faq-question">
                    {item.question}
                    <Plus size={18} aria-hidden="true" />
                  </CollapsibleTrigger>
                </h3>
                <CollapsibleContent className="faq-answer">
                  <p>{item.answer}</p>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </section>

        <section
          className="landing-invitation"
          aria-labelledby="invitation-title"
        >
          <img
            className="invitation-oak"
            src="/images/oak-study.webp"
            alt=""
            loading="lazy"
            width={600}
            height={600}
          />
          <p className="landing-eyebrow">
            Your next discovery is closer than you think
          </p>
          <h2 id="invitation-title">
            Shall we
            <br />
            <em>take a walk?</em>
          </h2>
          <StartJournal />
          <p className="landing-fineprint">
            Open in your browser. Make it yours on your home screen.
          </p>
          <img
            className="invitation-fern"
            src="/images/fern-study.webp"
            alt=""
            loading="lazy"
            width={600}
            height={600}
          />
        </section>
      </main>
      <footer className="landing-footer">
        <div className="footer-top">
          <Brand />
          <p>For a life a little more outside.</p>
          <Link to="/login" search={{ mode: "signin" }}>
            Sign in <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="footer-wordmark" aria-hidden="true">
          touch grass
        </div>
        <div className="footer-bottom">
          <span>Take only photographs. Leave room for wonder.</span>
          <Link to="/explore">
            Explore the app <ArrowRight size={13} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
