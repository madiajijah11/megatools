"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";
import { keccak256Hex } from "@/lib/keccak";

const SAMPLE_WHITELIST = `0x5B38Da6a701c568545dCfcB03FcB875f56beddC4
0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db
0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB`;

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

// OpenZeppelin standard: hash pair sorted
function hashPair(aHex: string, bHex: string): string {
  const a = aHex.replace(/^0x/, "").toLowerCase();
  const b = bHex.replace(/^0x/, "").toLowerCase();
  const combined = a < b ? a + b : b + a;
  return keccak256Hex(hexToBytes(combined));
}

interface MerkleProofItem {
  address: string;
  leaf: string;
  proof: string[];
}

export default function MerkleTreeGeneratorClient() {
  const [whitelistInput, setWhitelistInput] = useState<string>(SAMPLE_WHITELIST);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const tree = useMemo(() => {
    const lines = whitelistInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return {
        root: "",
        leaves: [],
        proofs: [],
        count: 0,
        error: "Enter at least 1 address",
      };
    }

    try {
      // 1. Compute leaves: keccak256(canonical lowercase address)
      const leafItems = lines.map((addr) => {
        const clean = addr.toLowerCase();
        // If address is raw hex or text, hash its bytes
        let leafHash = "";
        if (clean.startsWith("0x") && clean.length === 42) {
          leafHash = keccak256Hex(hexToBytes(clean.slice(2)));
        } else {
          leafHash = keccak256Hex(clean);
        }
        return { address: addr, leaf: leafHash };
      });

      // 2. Build layers
      const layers: string[][] = [leafItems.map((l) => l.leaf)];
      while (layers[layers.length - 1].length > 1) {
        const currentLayer = layers[layers.length - 1];
        const nextLayer: string[] = [];

        for (let i = 0; i < currentLayer.length; i += 2) {
          if (i + 1 < currentLayer.length) {
            nextLayer.push(hashPair(currentLayer[i], currentLayer[i + 1]));
          } else {
            // Odd element promoted to next level
            nextLayer.push(currentLayer[i]);
          }
        }
        layers.push(nextLayer);
      }

      const root = layers[layers.length - 1][0] ? "0x" + layers[layers.length - 1][0] : "";

      // 3. Generate proofs for each leaf
      const proofs: MerkleProofItem[] = leafItems.map((item, leafIndex) => {
        const proof: string[] = [];
        let index = leafIndex;

        for (let i = 0; i < layers.length - 1; i++) {
          const layer = layers[i];
          const isRightNode = index % 2 === 1;
          const pairIndex = isRightNode ? index - 1 : index + 1;

          if (pairIndex < layer.length) {
            proof.push("0x" + layer[pairIndex]);
          }
          index = Math.floor(index / 2);
        }

        return {
          address: item.address,
          leaf: "0x" + item.leaf,
          proof,
        };
      });

      return {
        root,
        leaves: leafItems,
        proofs,
        count: lines.length,
        error: null,
      };
    } catch (e) {
      return {
        root: "",
        leaves: [],
        proofs: [],
        count: 0,
        error: (e as Error).message,
      };
    }
  }, [whitelistInput]);

  const selectedProof = tree.proofs[selectedAddressIndex] || tree.proofs[0];

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Total Leaves</p>
        <p className="text-accent font-mono text-xs font-bold">{tree.count} Items</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Standard</p>
        <p className="text-text-primary font-mono text-xs">OpenZeppelin Sorted</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1 font-mono"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Merkle Tree Root & Proof Builder</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Generate cryptographic Merkle roots and OpenZeppelin-compatible verification proofs for airdrops and NFT whitelists.
            </p>
          </div>

          {/* Whitelist Input */}
          <div className="mb-6 space-y-2">
            <div className="h-8 flex items-center justify-between">
              <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                Whitelist Addresses (One per line):
              </label>
              <button
                type="button"
                onClick={() => setWhitelistInput(SAMPLE_WHITELIST)}
                className="text-xs font-mono text-text-muted hover:text-accent transition-colors px-2 py-1 rounded border border-border-subtle/60 bg-bg-page/60"
              >
                Reset Example
              </button>
            </div>
            <textarea
              value={whitelistInput}
              onChange={(e) => setWhitelistInput(e.target.value)}
              placeholder="0x5B38Da6a701c568545dCfcB03FcB875f56beddC4&#10;0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2..."
              rows={6}
              className="w-full p-3.5 rounded-xl bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          {tree.error && (
            <div className="p-3.5 mb-6 rounded-xl bg-error/10 border border-error/30 text-error font-mono text-xs">
              ⚠ {tree.error}
            </div>
          )}

          {/* Root Card */}
          {tree.root && (
            <div className="space-y-6 border-t border-border-subtle pt-6">
              <div className="p-4 rounded-xl border border-accent/40 bg-accent-soft/30">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-accent font-bold uppercase">
                    Merkle Root (bytes32 for Smart Contract)
                  </span>
                  <CopyButton
                    text={tree.root}
                    className="text-xs font-mono px-2 py-0.5 rounded border border-border-subtle/80 bg-bg-page/80 text-text-primary hover:border-accent/50 hover:bg-accent-soft transition-colors cursor-pointer"
                  />
                </div>
                <div className="font-mono text-base sm:text-xl font-bold text-accent break-all select-all py-1">
                  {tree.root}
                </div>
                <p className="text-[11px] font-mono text-text-muted mt-1">
                  Pass this root to your Solidity contract: <code>bytes32 public immutable merkleRoot = {tree.root};</code>
                </p>
              </div>

              {/* Interactive Proof Inspector */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono text-text-secondary font-bold uppercase">
                    Individual Airdrop Proof Explorer:
                  </span>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <span className="text-text-muted">Select Item:</span>
                    <select
                      value={selectedAddressIndex}
                      onChange={(e) => setSelectedAddressIndex(Number(e.target.value))}
                      className="p-1 rounded bg-bg-page border border-border-subtle text-text-primary text-xs font-mono focus:border-accent focus:outline-none"
                    >
                      {tree.proofs.map((p, idx) => (
                        <option key={idx} value={idx}>
                          #{idx + 1} ({p.address.slice(0, 8)}...{p.address.slice(-6)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedProof && (
                  <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-3">
                    <div>
                      <span className="text-[11px] font-mono text-text-muted block">Leaf Address:</span>
                      <span className="font-mono text-xs text-text-primary font-bold">{selectedProof.address}</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono text-text-muted">
                          Solidity Proof Array (<code>bytes32[] proof</code>):
                        </span>
                        <CopyButton
                          text={JSON.stringify(selectedProof.proof)}
                          className="text-xs font-mono px-2 py-0.5 rounded border border-border-subtle/80 bg-bg-card text-text-primary hover:border-accent/50 transition-colors cursor-pointer"
                        />
                      </div>
                      <pre className="p-3 rounded-lg bg-bg-card border border-border-subtle font-mono text-xs text-accent overflow-x-auto select-all">
                        {JSON.stringify(selectedProof.proof, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Full JSON Export */}
              <div className="border-t border-border-subtle pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-text-secondary font-bold uppercase">
                    Full Whitelist JSON Manifest:
                  </span>
                  <CopyButton
                    text={JSON.stringify(
                      {
                        root: tree.root,
                        count: tree.count,
                        claims: tree.proofs,
                      },
                      null,
                      2
                    )}
                    label="copy full JSON"
                    className="text-xs font-mono px-2 py-1 rounded border border-border-subtle/80 bg-bg-page/80 text-text-primary hover:border-accent/50 transition-colors cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: InfoPanel */}
        <div className="hidden lg:block">
          <InfoPanel toolId="merkle-tree-generator" stats={stats} />
        </div>
      </div>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="merkle-tree-generator" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
