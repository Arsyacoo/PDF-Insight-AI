import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfidenceBadge from "../components/ConfidenceBadge.jsx";
import SourceReference from "../components/SourceReference.jsx";
import RetrievalDetails from "../components/RetrievalDetails.jsx";
import ExportReportButtons from "../components/ExportReportButtons.jsx";
import DocumentQualityCard from "../components/DocumentQualityCard.jsx";

vi.mock("../api/api.js", () => ({
  exportReportUrl: (documentId, format) => `http://example.test/${documentId}.${format}`,
}));

describe("retrieval relevance UI", () => {
  it("maps legacy and new relevance labels", () => {
    const { rerender } = render(<ConfidenceBadge label="High" />);
    expect(screen.getByText("High Relevance")).toBeInTheDocument();
    rerender(<ConfidenceBadge label="Medium Relevance" />);
    expect(screen.getByText("Medium Relevance")).toBeInTheDocument();
    rerender(<ConfidenceBadge label="Low Relevance" />);
    expect(screen.getByText("Low Relevance")).toBeInTheDocument();
  });

  it("renders source page, snippet, score, and relevance label", () => {
    render(<SourceReference source={{ page_number: 7, snippet: "Important APAC evidence", score: 0.62, relevance_label: "Medium Relevance" }} />);
    expect(screen.getByText("Page 7")).toBeInTheDocument();
    expect(screen.getByText("Important APAC evidence")).toBeInTheDocument();
    expect(screen.getByText("Medium Relevance")).toBeInTheDocument();
    expect(screen.getByText("Source Relevance: 62%")).toBeInTheDocument();
  });

  it("click callback receives the source with correct page number", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const source = { page_number: 3, snippet: "Source text", score: 0.9, relevance_label: "High Relevance" };
    render(<SourceReference source={source} onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ page_number: 3 }));
  });

  it("retrieval details distinguish accepted and rejected chunks", async () => {
    const user = userEvent.setup();
    render(<RetrievalDetails details={{
      retrieval_method: "test retrieval",
      model: "test-model",
      total_chunks_retrieved: 2,
      chunks_above_threshold: 1,
      chunks_used_for_answer: 1,
      threshold: 0.25,
      results: [
        { page_number: 1, relevance_score: 0.7, passed_threshold: true },
        { page_number: 2, relevance_score: 0.1, passed_threshold: false },
      ],
    }} />);
    await user.click(screen.getByText("Show Retrieval Details"));
    expect(screen.getByText(/1 chunks above threshold 0.25/)).toBeInTheDocument();
    expect(screen.getByText(/Page 1/)).toHaveTextContent("accepted");
    expect(screen.getByText(/Page 2/)).toHaveTextContent("rejected");
  });

  it("does not show rejected chunks as supporting SourceReference cards", () => {
    const rejected = { page_number: 9, snippet: "Rejected chunk", relevance_score: 0.05, passed_threshold: false };
    render(<RetrievalDetails details={{ results: [rejected], total_chunks_retrieved: 1, chunks_above_threshold: 0 }} />);
    expect(screen.queryByText("Source Reference")).not.toBeInTheDocument();
  });
});

describe("export report buttons", () => {
  beforeEach(() => {
    globalThis.URL.createObjectURL = vi.fn(() => "blob:test");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state while exporting", async () => {
    const user = userEvent.setup();
    globalThis.fetch = vi.fn(() => new Promise(() => {}));
    render(<ExportReportButtons documentId="doc-1" />);
    await user.click(screen.getByText(/Full Report PDF/));
    expect(screen.getByText("Exporting...")).toBeInTheDocument();
  });

  it("shows error state when export fails", async () => {
    const user = userEvent.setup();
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false }));
    render(<ExportReportButtons documentId="doc-1" />);
    await user.click(screen.getByText(/Full Report PDF/));
    expect(await screen.findByText("Export gagal dibuat.")).toBeInTheDocument();
  });
});

describe("document quality card", () => {
  it("renders the quality label and metrics", () => {
    render(<DocumentQualityCard quality={{
      quality_label: "Poor",
      scan_probability: 0.7,
      scan_probability_label: "High",
      readable_pages: 1,
      empty_pages: 2,
      average_characters_per_page: 45,
      recommendation: "Gunakan PDF berbasis teks.",
    }} />);
    expect(screen.getByText("Poor")).toBeInTheDocument();
    expect(screen.getByText("70% (High)")).toBeInTheDocument();
    expect(screen.getByText("Gunakan PDF berbasis teks.")).toBeInTheDocument();
  });
});
