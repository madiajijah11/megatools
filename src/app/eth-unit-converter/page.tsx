import type { Metadata } from "next";
import EthUnitConverterClient from "./EthUnitConverterClient";

export const metadata: Metadata = {
  title: "Ethereum Unit Converter & Gas Fee Calculator — MegaTools",
  description:
    "Convert between Wei, Gwei, Finney, and Ether with zero floating-point loss. Calculate EIP-1559 gas fees and transaction costs 100% in your browser.",
  alternates: {
    canonical: "/eth-unit-converter",
  },
  openGraph: {
    title: "Ethereum Unit & Gas Fee Calculator",
    description: "Instant, high-precision EVM unit converter and transaction cost estimator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Ethereum Unit & Gas Fee Calculator",
  url: "https://megatools-tau.vercel.app/eth-unit-converter",
  description: "Convert high-precision values between Wei, Gwei, Finney, and Ether with EIP-1559 gas fee estimation.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function EthUnitConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EthUnitConverterClient />
    </>
  );
}
