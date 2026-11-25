import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Utensils, ShoppingBag, Receipt, HelpCircle, Bell, FileText, Coffee, Wallet, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CustomerBottomNav: React.FC = () => {
  const { cartItemCount, activeTableNumber, callWaiter, requestBill, customerAccount } = useApp();
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E0D8] shadow-[0_-6px_24px_rgba(23,63,53,0.06)] md:hidden">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
          <NavLink
            to={`/t/${activeTableNumber}`}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-[11px] transition-colors ${
                isActive ? 'text-[#173F35] font-bold' : 'text-[#737A75] hover:text-[#173F35]'
              }`
            }
          >
            <Utensils className="w-5 h-5 mb-0.5" />
            <span>Menyu</span>
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-[11px] transition-colors ${
                isActive ? 'text-[#173F35] font-bold' : 'text-[#737A75] hover:text-[#173F35]'
              }`
            }
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 mb-0.5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#173F35] text-[#F59E0B] text-[10px] font-extrabold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center tabular-nums">
                  {cartItemCount}
                </span>
              )}
            </div>
            <span>Savat</span>
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-[11px] transition-colors ${
                isActive ? 'text-[#173F35] font-bold' : 'text-[#737A75] hover:text-[#173F35]'
              }`
            }
          >
            <Receipt className="w-5 h-5 mb-0.5" />
            <span>Buyurtma</span>
          </NavLink>

          <NavLink
            to="/account"
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-[11px] transition-colors ${
                isActive ? 'text-[#173F35] font-bold' : 'text-[#737A75] hover:text-[#173F35]'
              }`
            }
          >
            <div className="relative">
              <Wallet className="w-5 h-5 mb-0.5" />
              {customerAccount && customerAccount.cashback_balance > 0 && (
                <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-[#10B981]" />
              )}
            </div>
            <span>Kabinet</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-[11px] text-[#737A75] hover:text-[#173F35] transition-colors"
          >
            <HelpCircle className="w-5 h-5 mb-0.5" />
            <span>Xizmat</span>
          </button>
        </div>
      </nav>

      {/* Quick Service Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-[#E5E0D8]">
            <div className="bg-[#173F35] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base">
                  Stol №{activeTableNumber} xizmatlari
                </h3>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Ofitsiantga tezkor chaqiruv yo&apos;llash
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                aria-label="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={async () => {
                  await callWaiter('Ofitsiant kerak');
                  setShowHelpModal(false);
                }}
                className="min-h-[56px] flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#FAF8F3] hover:bg-[#EFEAE0] border border-[#E5E0D8] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#173F35] text-[#F59E0B] flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#173F35]">Ofitsiantni chaqirish</h4>
                  <p className="text-[11px] text-[#59635E]">Yordam yoki maslahat olish uchun</p>
                </div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await callWaiter("Choy yoki suv to'ldirish");
                  setShowHelpModal(false);
                }}
                className="min-h-[56px] flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#FAF8F3] hover:bg-[#EFEAE0] border border-[#E5E0D8] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1E5245] text-[#F59E0B] flex items-center justify-center shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#173F35]">Choy / Suv so&apos;rash</h4>
                  <p className="text-[11px] text-[#59635E]">Choynakni yangilash yoki to&apos;ldirish</p>
                </div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await requestBill();
                  setShowHelpModal(false);
                }}
                className="min-h-[56px] flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#FAF8F3] hover:bg-[#EFEAE0] border border-[#E5E0D8] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F59E0B] text-[#173F35] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#173F35]">Hisob-kitobni so&apos;rash</h4>
                  <p className="text-[11px] text-[#59635E]">Chekni olib kelish (Click, Payme, naqd)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="mt-1 w-full min-h-[44px] rounded-xl bg-[#F3EFE6] hover:bg-[#E5E0D8] text-[#173F35] text-xs font-semibold transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
