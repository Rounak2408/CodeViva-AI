import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { AnalysisResult } from "@/types/analysis";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#0a0d14",
  },
  hero: {
    backgroundColor: "#111827",
    padding: 36,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  brand: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: "#a78bfa",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  h1: {
    fontSize: 22,
    color: "#fafafa",
    fontFamily: "Helvetica",
    fontWeight: "bold",
    marginBottom: 4,
  },
  sub: { fontSize: 12, color: "#a1a1aa", marginBottom: 6 },
  body: { padding: 36, color: "#e4e4e7" },
  h2: {
    fontSize: 13,
    marginTop: 18,
    marginBottom: 8,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    color: "#c4b5fd",
  },
  muted: { color: "#a1a1aa", fontSize: 9 },
  box: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 8,
    color: "#71717a",
    textAlign: "center",
  },
});

export function ReportPdf({
  data,
  title,
}: {
  data: AnalysisResult;
  title?: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.brand}>CodeViva AI</Text>
          <Text style={styles.h1}>{title ?? "Analysis report"}</Text>
          <Text style={styles.sub}>
            Repository intelligence · Educators & hiring teams
          </Text>
          <Text style={styles.muted}>
            Generated {new Date().toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.h2}>Scores</Text>
          <View style={styles.box}>
            <Text>AI probability: {data.meta.aiProbability}%</Text>
            <Text>Template / copy similarity: {data.meta.templateSimilarity}%</Text>
            <Text>Code quality: {data.meta.codeQuality}%</Text>
            <Text>Project level: {data.meta.projectLevel}</Text>
            <Text>LOC estimate: {data.meta.locEstimate}</Text>
            <Text>Files: {data.meta.totalFiles}</Text>
          </View>

          <Text style={styles.h2}>Tech stack</Text>
          <Text>{data.meta.techStack.join(", ") || "—"}</Text>

          <Text style={styles.h2}>Summary</Text>
          <Text>{data.resume}</Text>

          <Text style={styles.h2}>Weaknesses</Text>
          {data.weaknesses.map((w, i) => (
            <Text key={i}>• {w}</Text>
          ))}

          <Text style={styles.h2}>Suggestions</Text>
          {data.suggestions.map((s, i) => (
            <Text key={i}>• {s}</Text>
          ))}
        </View>
        <Text style={styles.footer} fixed>
          CodeViva AI · codeviva.ai
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.h1}>Viva questions</Text>
        </View>
        <View style={styles.body}>
          {data.viva.map((q, i) => (
            <View key={i} style={styles.box} wrap={false}>
              <Text style={{ fontWeight: "bold", color: "#fafafa", marginBottom: 4 }}>
                {q.question}
              </Text>
              <Text style={styles.muted}>File: {q.sourceFile}</Text>
              <Text>Keywords: {q.keywords.join(", ")}</Text>
              <Text>Expected: {q.expectedAnswer}</Text>
              <Text>Difficulty: {q.difficulty}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.footer} fixed>
          CodeViva AI · codeviva.ai
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.h1}>Interview & security</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.h2}>Interview questions</Text>
          {data.interview.map((q, i) => (
            <View key={i} style={styles.box} wrap={false}>
              <Text style={{ fontWeight: "bold", color: "#fafafa", marginBottom: 4 }}>
                {q.question}
              </Text>
              <Text style={styles.muted}>File: {q.sourceFile}</Text>
              <Text>Keywords: {q.keywords.join(", ")}</Text>
              <Text>Expected: {q.expectedAnswer}</Text>
              <Text>Difficulty: {q.difficulty}</Text>
            </View>
          ))}

          <Text style={styles.h2}>Security</Text>
          {data.security.map((s, i) => (
            <Text key={i} style={{ marginBottom: 6 }}>
              [{s.severity}] {s.category}: {s.detail}
              {s.file ? ` (${s.file})` : ""}
            </Text>
          ))}

          <Text style={styles.h2}>Architecture</Text>
          <Text>{data.architecture.summary}</Text>
          <Text>Patterns: {data.architecture.patterns.join(", ")}</Text>
          <Text>State: {data.architecture.stateManagement}</Text>
        </View>
        <Text style={styles.footer} fixed>
          CodeViva AI · codeviva.ai
        </Text>
      </Page>
    </Document>
  );
}
