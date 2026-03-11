import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const WAMOCON_ORANGE = "#f59e0b";
const WAMOCON_DARK = "#1a1a1a";
const WAMOCON_GRAY = "#6b7280";
const WAMOCON_LIGHT = "#f9fafb";

const s = StyleSheet.create({
  page: {
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontSize: 12,
    fontFamily: "Helvetica",
    color: WAMOCON_DARK,
    lineHeight: 1.4,
  },

  /* ── Header (fixed) ── */
  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    paddingHorizontal: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: WAMOCON_ORANGE,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  headerLogo: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    color: WAMOCON_DARK,
  },
  headerLogoAccent: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    color: WAMOCON_ORANGE,
  },
  headerCompany: {
    fontSize: 8,
    color: WAMOCON_GRAY,
    textAlign: "right",
    letterSpacing: 0.8,
  },

  /* ── Footer (fixed) ── */
  footerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    paddingHorizontal: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  footerLeft: {
    fontSize: 7,
    color: WAMOCON_GRAY,
  },
  footerRight: {
    fontSize: 7,
    color: WAMOCON_GRAY,
  },

  /* ── Title block ── */
  titleBlock: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: WAMOCON_ORANGE,
  },
  docTitle: {
    fontSize: 22,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    color: WAMOCON_DARK,
    marginBottom: 2,
  },
  docSubtitle: {
    fontSize: 10,
    color: WAMOCON_GRAY,
    marginBottom: 2,
  },
  docType: {
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    color: WAMOCON_ORANGE,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  /* ── Sections ── */
  section: {
    marginBottom: 18,
  },
  h1: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    color: WAMOCON_DARK,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  h2: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    color: WAMOCON_DARK,
    marginBottom: 8,
    marginTop: 4,
  },

  /* ── Table ── */
  tableHeader: {
    flexDirection: "row",
    backgroundColor: WAMOCON_DARK,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: WAMOCON_LIGHT,
  },
  tableColTitle: { flex: 1, fontSize: 10 },
  tableColStatus: { width: 65, fontSize: 9, textAlign: "center" },
  tableColVerdict: {
    width: 90,
    fontSize: 9,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  verdictAccepted: { backgroundColor: "#dcfce7", color: "#166534" },
  verdictContested: { backgroundColor: "#fee2e2", color: "#991b1b" },
  verdictDeferred: { backgroundColor: "#fef3c7", color: "#92400e" },
  defectNote: {
    fontSize: 8,
    color: WAMOCON_GRAY,
    marginTop: 2,
    marginLeft: 10,
    paddingBottom: 4,
  },

  /* ── Info table (key-value) ── */
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: 110,
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    color: WAMOCON_GRAY,
  },
  infoValue: {
    flex: 1,
    fontSize: 11,
    color: WAMOCON_DARK,
  },

  /* ── Consent + Signatures ── */
  consentBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  consentText: {
    fontSize: 9,
    color: "#374151",
    fontStyle: "italic",
    textAlign: "center",
  },
  signatureRow: {
    flexDirection: "row",
    gap: 30,
    marginTop: 12,
  },
  signatureBlock: {
    flex: 1,
    alignItems: "center",
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    color: WAMOCON_GRAY,
    marginBottom: 6,
  },
  signatureImage: {
    width: 180,
    height: 70,
    objectFit: "contain",
  },
  signatureLine: {
    width: 180,
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    marginTop: 2,
  },

  /* ── Hash ── */
  hashBox: {
    marginTop: 20,
    padding: 8,
    backgroundColor: WAMOCON_LIGHT,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
  },
  hashText: {
    fontSize: 6,
    fontFamily: "Courier",
    color: "#9ca3af",
    textAlign: "center",
  },
});

/* ── Types ── */

interface DefectVerdict {
  defect_id: string;
  verdict: string;
  note?: string | null;
  correction_deadline?: string | null;
  defects?: {
    id: string;
    title: string;
    status: string;
    priority: string;
  } | null;
}

interface ProtocolData {
  id: string;
  title: string;
  location?: string | null;
  inspection_date: string;
  participants: string;
  general_notes?: string | null;
  consent_clause: string;
  signature_contractor?: string | null;
  signature_client?: string | null;
  integrity_hash?: string | null;
  created_at: string;
  protocol_defect_verdicts: DefectVerdict[];
}

/* ── Helpers ── */

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

const VERDICT_MAP: Record<string, string> = {
  akzeptiert: "Akzeptiert",
  beanstandet: "Beanstandet",
  zurueckgestellt: "Zurückgestellt",
};

const STATUS_MAP: Record<string, string> = {
  offen: "Offen",
  in_arbeit: "In Bearbeitung",
  erledigt: "Erledigt",
  problem: "Problem",
};

function verdictStyle(v: string) {
  if (v === "akzeptiert") return s.verdictAccepted;
  if (v === "beanstandet") return s.verdictContested;
  return s.verdictDeferred;
}

/* ── Document ── */

function ProtocolPdfDocument({ data }: { data: ProtocolData }) {
  const accepted = data.protocol_defect_verdicts.filter(
    (v) => v.verdict === "akzeptiert"
  ).length;
  const contested = data.protocol_defect_verdicts.filter(
    (v) => v.verdict === "beanstandet"
  ).length;
  const deferred = data.protocol_defect_verdicts.filter(
    (v) => v.verdict === "zurueckgestellt"
  ).length;
  const total = data.protocol_defect_verdicts.length;

  return (
    <Document
      title={`Abnahmeprotokoll — ${data.title}`}
      author="WAMOCON GmbH"
      subject="Abnahmeprotokoll"
      creator="Ustafix Baumängel-Management"
    >
      <Page size="A4" style={s.page}>
        {/* ── HEADER ── */}
        <View style={s.headerBar} fixed>
          <View style={s.headerBrand}>
            <Text style={s.headerLogo}>Ustafix</Text>
            <Text style={s.headerLogoAccent}>.app</Text>
          </View>
          <View>
            <Text style={s.headerCompany}>WAMOCON GmbH</Text>
            <Text style={[s.headerCompany, { marginTop: 1 }]}>
              Baumängel-Management
            </Text>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={s.footerBar} fixed>
          <Text style={s.footerLeft}>
            WAMOCON GmbH — {data.title} — {formatDateShort(data.created_at)}
          </Text>
          <Text
            style={s.footerRight}
            render={({ pageNumber, totalPages }) =>
              `Seite ${pageNumber} von ${totalPages}`
            }
          />
        </View>

        {/* ── TITLE BLOCK ── */}
        <View style={s.titleBlock}>
          <Text style={s.docType}>Abnahmeprotokoll</Text>
          <Text style={s.docTitle}>{data.title}</Text>
          <Text style={s.docSubtitle}>
            Erstellt am {formatDate(data.created_at)}
          </Text>
        </View>

        {/* ── 1. ALLGEMEIN ── */}
        <View style={s.section}>
          <Text style={s.h1}>1. Allgemeine Informationen</Text>
          {data.location && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Ort:</Text>
              <Text style={s.infoValue}>{data.location}</Text>
            </View>
          )}
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Datum:</Text>
            <Text style={s.infoValue}>
              {formatDate(data.inspection_date)}
            </Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Teilnehmer:</Text>
            <Text style={s.infoValue}>{data.participants}</Text>
          </View>
          {data.general_notes && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Anmerkungen:</Text>
              <Text style={s.infoValue}>{data.general_notes}</Text>
            </View>
          )}
        </View>

        {/* ── 2. MÄNGELBEWERTUNG ── */}
        <View style={s.section}>
          <Text style={s.h1}>2. Mängelbewertung</Text>
          <Text style={s.h2}>
            {total} Mängel — {accepted} akzeptiert, {contested} beanstandet,{" "}
            {deferred} zurückgestellt
          </Text>

          {/* Table header */}
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, { flex: 1 }]}>Mangel</Text>
            <Text style={[s.tableHeaderText, { width: 65, textAlign: "center" }]}>
              Status
            </Text>
            <Text style={[s.tableHeaderText, { width: 90, textAlign: "center" }]}>
              Bewertung
            </Text>
          </View>

          {/* Table rows */}
          {data.protocol_defect_verdicts.map((v, i) => (
            <View key={i} wrap={false}>
              <View
                style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
              >
                <Text style={s.tableColTitle}>
                  {v.defects?.title ??
                    `Mangel ${v.defect_id.slice(0, 8)}`}
                </Text>
                <Text style={s.tableColStatus}>
                  {STATUS_MAP[v.defects?.status ?? ""] ?? v.defects?.status}
                </Text>
                <View style={[s.tableColVerdict, verdictStyle(v.verdict)]}>
                  <Text>{VERDICT_MAP[v.verdict] ?? v.verdict}</Text>
                </View>
              </View>
              {v.note && <Text style={s.defectNote}>{v.note}</Text>}
              {v.correction_deadline && (
                <Text style={s.defectNote}>
                  Frist: {formatDate(v.correction_deadline)}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* ── 3. UNTERSCHRIFTEN ── */}
        <View style={s.section} wrap={false}>
          <Text style={s.h1}>3. Einverständnis & Unterschriften</Text>

          <View style={s.consentBox}>
            <Text style={s.consentText}>{data.consent_clause}</Text>
          </View>

          <View style={s.signatureRow}>
            <View style={s.signatureBlock}>
              <Text style={s.signatureLabel}>Auftragnehmer</Text>
              {data.signature_contractor ? (
                <>
                  <Image
                    style={s.signatureImage}
                    src={data.signature_contractor}
                  />
                  <View style={s.signatureLine} />
                </>
              ) : (
                <View style={s.signatureLine} />
              )}
            </View>
            <View style={s.signatureBlock}>
              <Text style={s.signatureLabel}>Auftraggeber</Text>
              {data.signature_client ? (
                <>
                  <Image
                    style={s.signatureImage}
                    src={data.signature_client}
                  />
                  <View style={s.signatureLine} />
                </>
              ) : (
                <View style={s.signatureLine} />
              )}
            </View>
          </View>
        </View>

        {/* ── INTEGRITY HASH ── */}
        {data.integrity_hash && (
          <View style={s.hashBox}>
            <Text style={s.hashText}>
              Integritäts-Hash (SHA-256): {data.integrity_hash}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function renderProtocolPdf(
  data: ProtocolData
): Promise<Buffer> {
  return renderToBuffer(<ProtocolPdfDocument data={data} />);
}
