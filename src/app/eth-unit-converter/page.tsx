import type { Metadata } from "next";
import EthUnitConverterClient from "./EthUnitConverterClient";

export const metadata: Metadata = {
  title: "Ethereum Unit Converter & Gas Fee Calculator — MegaTools",
  description:
    "Convert between Wei, Gwei, Finney, and Ether with zero floating-point loss. Calculate EIP-1559 gas fees and transaction costs 100% in your browser.",
  openGraph: {
    title: "Ethereum Unit & Gas Fee Calculator",
    description: "Instant, high-precision EVM unit converter and transaction cost estimator.",
  },
};

export default function EthUnitConverterPage() {
  return <EthUnitConverterClient />;
}
