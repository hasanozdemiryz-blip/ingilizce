import { useEffect } from 'react';
import { CardVisual } from './CardVisual';
import { seslendir } from '../speech';
import { Card as CardShell, HookChip, Ikon, SpeakButton, Yonerge } from './ui';
import type { Card } from '../types';
import { t } from '../dil';

/**
 * YENI KELIME — tanisma yuzu.
 *
 * Gizlenen hicbir sey yok: amac "haa" anini yasatmak. Burada soru
 * sorulmaz, not verilmez. Kancanin tutup tutmadigi hemen ardindaki
 * ogrenme testinde OLCULUR (bkz. scheduler.ts `learningCheck`) — once
 * kullaniciya soruluyordu ve bu bir beyandi.
 *
 * KELIME ILK GORULDUGU ANDA OKUNUYOR. Kanca bir ses benzerligi; onu kulakta
 * kurmanin en iyi ani ilk tanisma. Once bu kart sessizdi ve telaffuz ancak
 * cevaptan sonra duyuluyordu. `sesli` Ayarlar'daki "Telaffuz sesi" —
 * kapaliyken yalnizca dugme var.
 */
export function LearnFace({ card, sesli = false }: { card: Card; sesli?: boolean }) {
  useEffect(() => {
    if (sesli) seslendir(card.en);
  }, [card.en, sesli]);

  return (
    <CardShell className="w-full">
      <CardVisual card={card} />
      <div className="flex flex-col items-center gap-3 pt-5">
        <div className="flex items-center gap-3">
          <p className="word text-[2.75rem] leading-none font-extrabold">{card.en}</p>
          <SpeakButton word={card.en} size="small" />
        </div>
        <p className="word text-xl leading-none font-semibold text-ink-soft">{card.tr}</p>
        <HookChip big>
          {card.en} ≈ {card.hook}
        </HookChip>
        <p className="text-center text-ink-soft leading-relaxed max-w-[30ch]">“{card.sentence}”</p>
      </div>
    </CardShell>
  );
}

/**
 * YAZMA — merdivenin 5. basamagi.
 * Gorsel ve cumle YOK: cumlelerin %80'inde Turkce karsilik geciyor,
 * gorsel de kancayi resmediyor; ikisi de ipucu olurdu.
 */
export function WriteFace({ card, hookRevealed }: { card: Card; hookRevealed: boolean }) {
  return (
    <CardShell className="w-full">
      <div className="flex flex-col items-center gap-3 py-8 [@media(max-height:560px)]:py-3">
        <Yonerge>{t('İngilizcesi ne?')}</Yonerge>
        <p className="text-[2.5rem] leading-none font-extrabold text-center">{card.tr}</p>
        {hookRevealed && (
          <span className="pop">
            <HookChip>{card.hook}</HookChip>
          </span>
        )}
      </div>
    </CardShell>
  );
}

/**
 * DINLEME — merdivenin son basamagi.
 *
 * Kanca telaffuzu ogretemez, hatta yanlisini ogretir (`sell ≈ sel`).
 * Bu yuz onun panzehiri: kelime yazili hic gorunmeden, sadece duyularak
 * taninmali. Tekrar dinlemek serbest ve yardim sayilmaz — sinav telaffuzu
 * TANIMAK, tek seferde yakalamak degil.
 */
export function ListenFace({ card, hookRevealed }: { card: Card; hookRevealed: boolean }) {
  useEffect(() => {
    seslendir(card.en);
  }, [card.en]);

  return (
    <CardShell className="w-full">
      <div className="flex flex-col items-center gap-4 py-10 [@media(max-height:560px)]:gap-2 [@media(max-height:560px)]:py-3">
        <Yonerge>{t('Ne duyuyorsun?')}</Yonerge>
        <button
          type="button"
          aria-label={t('Tekrar dinle')}
          onClick={() => seslendir(card.en)}
          className="h-32 w-32 [@media(max-height:560px)]:h-16 [@media(max-height:560px)]:w-16 grid place-items-center rounded-full bg-brand shadow-[0_14px_30px_-12px_rgba(79,146,246,0.95)] transition-all active:scale-90"
        >
          {/* Mavi zemin: ikon ters (krem) varyantta, yoksa lacivert kayboluyor */}
          <Ikon ad="ses" ters className="h-16 w-16 [@media(max-height:560px)]:h-8 [@media(max-height:560px)]:w-8" />
        </button>
        <span className="text-base font-semibold text-ink-soft">{t('Dokun, tekrar dinle')}</span>
        {hookRevealed && (
          <span className="pop">
            <HookChip>{card.hook}</HookChip>
          </span>
        )}
      </div>
    </CardShell>
  );
}

/** Cevap yuzu — her zaman TAM bilgi. Kelime, anlam, kanca, cumle, ses. */
export function AnswerFace({ card }: { card: Card }) {
  return (
    <CardShell className="w-full rise">
      {/* Klavye acikken (kisa ekran) gorsel cekiliyor: soru ve kutu sigsin */}
      <div className="[@media(max-height:560px)]:hidden">
        <CardVisual card={card} size="compact" />
      </div>
      <div className="flex flex-col items-center gap-3 pt-5">
        <div className="flex items-center gap-2.5">
          <p className="word text-xl leading-none font-semibold text-ink-faint">{card.en}</p>
          <SpeakButton word={card.en} size="small" />
        </div>
        <p className="word text-[2.5rem] leading-none font-extrabold text-center">{card.tr}</p>
        <HookChip>
          {card.en} ≈ {card.hook}
        </HookChip>
        <p className="text-center text-ink-soft leading-relaxed max-w-[30ch]">“{card.sentence}”</p>
      </div>
    </CardShell>
  );
}
