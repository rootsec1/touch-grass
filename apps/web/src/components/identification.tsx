import type { Identification } from "@touch-grass/api/domain";
import { confidenceLabels } from "@touch-grass/api/domain";
import { Badge } from "@touch-grass/ui/components/badge";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@touch-grass/ui/components/alert";
import { Leaf, ChevronDown } from "lucide-react";
import { Button } from "@touch-grass/ui/components/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@touch-grass/ui/components/collapsible";
export function IdentificationDetails({ result }: { result: Identification }) {
  return (
    <div className="result-panel result-reveal identification">
      <div className="identification-heading">
        <Badge variant="secondary">
          <Leaf data-icon="inline-start" />
          {result.isPlant
            ? confidenceLabels[result.confidence]
            : "Let's look again"}
        </Badge>
        <h2 className="mt-3">
          {result.isPlant ? result.commonName : "No clear plant in view"}
        </h2>
        {result.scientificName ? (
          <p className="scientific">
            {result.scientificName}
            {result.family ? ` · ${result.family}` : ""}
          </p>
        ) : null}
      </div>
      <p>{result.summary}</p>
      {result.features.length ? (
        <div>
          <h3 className="font-medium mb-3">Clues to look for</h3>
          <ul className="fact-list">
            {result.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.ecology ? (
        <Alert>
          <Leaf />
          <AlertTitle>Its place in nature</AlertTitle>
          <AlertDescription>{result.ecology}</AlertDescription>
        </Alert>
      ) : null}
      {result.fact ? (
        <p className="text-muted-foreground text-sm">{result.fact}</p>
      ) : null}
      {result.nextPhoto ? (
        <p className="text-sm">
          <strong>For a closer match: </strong>
          {result.nextPhoto}
        </p>
      ) : null}
      {result.alternatives.length ? (
        <Collapsible className="capture-notes">
          <CollapsibleTrigger render={<Button variant="ghost" />}>
            <span>Other possible matches</span>
            <ChevronDown data-icon="inline-end" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            {result.alternatives.map((a) => (
              <p key={a.scientificName} className="text-sm mb-2">
                <strong>{a.commonName}.</strong> {a.difference}
              </p>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
      <p className="meta">
        An AI suggestion, not a confirmed identification. Never use it to decide
        whether a plant is safe to eat or touch.
      </p>
    </div>
  );
}
