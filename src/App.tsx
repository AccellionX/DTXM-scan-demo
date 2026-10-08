import { lazy, Suspense, useRef, useState } from "react";
import {
  fetchProductByBarcode,
  lookupErrorMessage,
  ProductNotFoundError,
  searchProductsByName,
} from "./api/openBeautyFacts";
import { IngredientSheet } from "./components/IngredientSheet";
import { Shell } from "./components/Shell";
import type { IngredientAssessment } from "./engine";
import { AnalysingScreen } from "./screens/AnalysingScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ResultScreen } from "./screens/ResultScreen";
const ScanScreen = lazy(() => import("./screens/ScanScreen").then((module) => ({ default: module.ScanScreen })));
import { SearchScreen } from "./screens/SearchScreen";
import { StatusScreen } from "./screens/StatusScreen";
import type { Product, SampleProduct } from "./types";

type Flow =
  | { screen: "home" }
  | { screen: "scan"; pending: string | null }
  | { screen: "search"; query: string; status: "loading" | "ready" | "error"; results: Product[] }
  | { screen: "analysing"; product: Product }
  | { screen: "result"; product: Product }
  | { screen: "not-found"; barcode: string }
  | { screen: "error"; message: string; retry: "scan" | "search"; query?: string; barcode?: string };

export default function App() {
  const [flow, setFlow] = useState<Flow>({ screen: "home" });
  const [selected, setSelected] = useState<IngredientAssessment | null>(null);
  const requestId = useRef(0);

  function goHome() {
    requestId.current += 1;
    setSelected(null);
    setFlow({ screen: "home" });
  }

  function openScan() {
    setSelected(null);
    setFlow({ screen: "scan", pending: null });
  }

  function beginAnalysis(product: Product) {
    setSelected(null);
    setFlow({ screen: "analysing", product });
  }

  async function lookupBarcode(barcode: string) {
    const id = ++requestId.current;
    setSelected(null);
    setFlow({ screen: "scan", pending: barcode });
    try {
      const product = await fetchProductByBarcode(barcode);
      if (requestId.current !== id) return;
      setFlow({ screen: "analysing", product });
    } catch (error) {
      if (requestId.current !== id) return;
      if (error instanceof ProductNotFoundError) {
        setFlow({ screen: "not-found", barcode });
        return;
      }
      setFlow({
        screen: "error",
        message: lookupErrorMessage(error),
        retry: "scan",
        barcode,
      });
    }
  }

  async function runSearch(query: string) {
    const id = ++requestId.current;
    setSelected(null);
    setFlow({ screen: "search", query, status: "loading", results: [] });
    try {
      const results = await searchProductsByName(query);
      if (requestId.current !== id) return;
      setFlow({ screen: "search", query, status: "ready", results });
    } catch {
      if (requestId.current !== id) return;
      setFlow({ screen: "search", query, status: "error", results: [] });
    }
  }

  function openSample(sample: SampleProduct) {
    beginAnalysis({
      code: null,
      product_name: sample.product_name,
      brands: sample.brands,
      image_front_url: sample.image_front_url,
      ingredients_text: sample.ingredients_text,
    });
  }

  const onBack = flow.screen === "home" ? undefined : goHome;

  return (
    <Shell
      onBack={onBack}
      overlay={
        selected ? <IngredientSheet item={selected} onClose={() => setSelected(null)} /> : null
      }
    >
      {flow.screen === "home" ? (
        <HomeScreen onScan={openScan} onSearch={(query) => void runSearch(query)} onSample={openSample} />
      ) : null}

      {flow.screen === "scan" ? (
        <Suspense
          fallback={
            <p className="rounded-2xl border border-border bg-surface px-4 py-5 text-[15px]" role="status">
              Starting the camera…
            </p>
          }
        >
          <ScanScreen pending={flow.pending} onBarcode={(code) => void lookupBarcode(code)} />
        </Suspense>
      ) : null}

      {flow.screen === "search" ? (
        <SearchScreen
          query={flow.query}
          status={flow.status}
          results={flow.results}
          onPick={beginAnalysis}
          onRetry={() => void runSearch(flow.query)}
        />
      ) : null}

      {flow.screen === "analysing" ? (
        <AnalysingScreen product={flow.product} onDone={() => setFlow({ screen: "result", product: flow.product })} />
      ) : null}

      {flow.screen === "result" ? (
        <ResultScreen product={flow.product} onSelect={setSelected} onScanAnother={openScan} />
      ) : null}

      {flow.screen === "not-found" ? (
        <StatusScreen
          title="Product not found"
          message={`We couldn't find barcode ${flow.barcode} in Open Beauty Facts. Check the digits, or try another product.`}
          primaryLabel="Try another barcode"
          onPrimary={openScan}
          secondaryLabel="Back to start"
          onSecondary={goHome}
        />
      ) : null}

      {flow.screen === "error" ? (
        <StatusScreen
          title="Something went wrong"
          message={flow.message}
          primaryLabel="Try again"
          onPrimary={() => {
            if (flow.retry === "search" && flow.query) void runSearch(flow.query);
            else if (flow.barcode) void lookupBarcode(flow.barcode);
            else openScan();
          }}
          secondaryLabel="Back to start"
          onSecondary={goHome}
        />
      ) : null}
    </Shell>
  );
}
