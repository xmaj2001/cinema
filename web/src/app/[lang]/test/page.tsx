'use client'

import React, { useState } from 'react';
import { Printer, Film, Calendar, Clock, MapPin, Armchair, Ticket, Tag, CheckCircle2, RefreshCw } from 'lucide-react';

export default function App() {
  const [ticketData, setTicketData] = useState({
    cinemaUnit: 'CINEMAX TALATONA',
    movieTitle: 'O REINO DAS SOMBRAS',
    classification: '14 ANOS',
    genre: 'Acção / Aventura',
    duration: '135 MIN',
    room: 'SALA 3',
    seat: 'F-12',
    row: 'Fila F',
    seatNum: 'Assento 12',
    category: 'VIP',
    date: '18/10/2026',
    time: '19:30',
    ticketType: 'INTEIRA',
    price: '4.500,00 AKZ',
    paymentMethod: 'MULTICAIXA',
    code: 'CZ101826F12-AB',
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTicketData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-4 sm:p-8 print:p-0 print:bg-white flex flex-col items-center">
      {/* CSS Styles specialized for print layout */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            margin: 0 auto !important;
            width: 80mm !important; /* Standard thermal receipt width */
            max-width: 100% !important;
            padding: 12px !important;
            page-break-inside: avoid;
          }
          @page {
            size: auto;
            margin: 5mm;
          }
        }

        /* Jagged bottom edge effect for receipt aesthetic */
        .jagged-bottom {
          background-image: linear-gradient(135deg, #ffffff 50%, transparent 50%), linear-gradient(225deg, #ffffff 50%, transparent 50%);
          background-position: top left, top left;
          background-size: 12px 12px;
          background-repeat: repeat-x;
        }
      `}</style>

      {/* Screen Header Controls (Hidden when printing) */}
      <header className="no-print max-w-2xl w-full mb-6 text-center">
        <div className="inline-flex items-center space-x-2 bg-blue-900 text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          <Ticket className="w-4 h-4" />
          <span>Sistema de Bilheteira Cinemax</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Ingresso Digital & Impressão
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Visualize o seu bilhete do Cinemax e imprima ou guarde em formato PDF.
        </p>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <Printer className="w-5 h-5" />
            <span>Imprimir Bilhete / Salvar PDF</span>
          </button>

          <button
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-5 py-3 rounded-xl font-semibold shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isCustomizing ? 'rotate-180 transition-transform' : ''}`} />
            <span>{isCustomizing ? 'Fechar Edição' : 'Personalizar Dados'}</span>
          </button>
        </div>
      </header>

      {/* Live Customization Panel (Optional for user) */}
      {isCustomizing && (
        <div className="no-print max-w-2xl w-full bg-white p-6 rounded-2xl shadow-md border border-slate-200 mb-8 transition-all">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2 border-b pb-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <span>Personalizar Informações do Ingresso</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">Filme</label>
              <input
                type="text"
                name="movieTitle"
                value={ticketData.movieTitle}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Unidade</label>
              <input
                type="text"
                name="cinemaUnit"
                value={ticketData.cinemaUnit}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Sala</label>
              <input
                type="text"
                name="room"
                value={ticketData.room}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Lugar</label>
              <input
                type="text"
                name="seat"
                value={ticketData.seat}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Data</label>
              <input
                type="text"
                name="date"
                value={ticketData.date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Sessão (Hora)</label>
              <input
                type="text"
                name="time"
                value={ticketData.time}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Preço</label>
              <input
                type="text"
                name="price"
                value={ticketData.price}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Classificação</label>
              <input
                type="text"
                name="classification"
                value={ticketData.classification}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Tipo de Ingresso</label>
              <input
                type="text"
                name="ticketType"
                value={ticketData.ticketType}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Thermal Ticket Printable Container */}
      <main className="print-area bg-white text-black font-mono w-[380px] p-6 shadow-2xl rounded-sm border border-slate-200 relative select-none">
        
        {/* Ticket Header & Logo */}
        <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4">
          <div className="flex justify-center items-center space-x-1 mb-1">
            <span className="text-2xl font-black tracking-tighter text-blue-900 uppercase font-sans">
              CINE<span className="text-amber-500">MAX</span>
            </span>
          </div>
          <p className="text-xs font-bold tracking-wider font-sans uppercase text-slate-800">
            {ticketData.cinemaUnit}
          </p>
          <p className="text-[10px] text-slate-500 uppercase font-sans mt-0.5">
            COMPROVATIVO DE ENTRADA
          </p>
        </div>

        {/* Movie Title Section */}
        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            FILME:
          </span>
          <h2 className="text-xl font-black leading-tight uppercase font-sans text-black mt-0.5">
            {ticketData.movieTitle}
          </h2>
          <div className="text-[11px] mt-1 space-x-1 text-slate-700 font-sans">
            <span>CLASSIFICAÇÃO: <strong>{ticketData.classification}</strong></span>
            <span>|</span>
            <span>GÊNERO: <strong>{ticketData.genre}</strong></span>
          </div>
          <div className="text-[11px] text-slate-700 font-sans">
            DURAÇÃO: <strong>{ticketData.duration}</strong>
          </div>
        </div>

        <div className="border-t border-black my-3"></div>

        {/* Room & Seat Highlight Box */}
        <div className="grid grid-cols-2 gap-2 my-2 bg-slate-50 p-2 border border-slate-300 rounded">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              SALA:
            </span>
            <span className="text-2xl font-black text-black font-sans leading-none">
              {ticketData.room}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              LUGAR:
            </span>
            <span className="text-2xl font-black text-blue-900 font-sans leading-none">
              {ticketData.seat}
            </span>
          </div>
        </div>

        {/* Session Details */}
        <div className="space-y-1 my-3 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600 uppercase">SESSÃO:</span>
            <span className="font-bold">{ticketData.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 uppercase">DATA:</span>
            <span className="font-bold">{ticketData.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 uppercase">LUGAR DETALHADO:</span>
            <span className="font-bold">{ticketData.row} | {ticketData.seatNum}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 uppercase">CATEGORIA:</span>
            <span className="font-bold uppercase">{ticketData.category}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-3"></div>

        {/* Pricing and Payment */}
        <div className="space-y-1 text-xs my-3">
          <div className="flex justify-between">
            <span className="text-slate-600 uppercase">TIPO INGRESSO:</span>
            <span className="font-bold">{ticketData.ticketType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 uppercase">VALOR PAGO:</span>
            <span className="font-bold text-sm">{ticketData.price}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 uppercase">PAGAMENTO:</span>
            <span className="font-bold">{ticketData.paymentMethod}</span>
          </div>
        </div>

        <div className="border-t-2 border-black my-4"></div>

        {/* QR Code and Barcode Section */}
        <div className="flex flex-col items-center justify-center space-y-3 pt-1">
          <div className="flex items-center space-x-4 w-full justify-center">
            {/* Simulated QR Code SVG */}
            <div className="bg-white p-1 border border-slate-300 rounded">
              <svg className="w-20 h-20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" fill="white"/>
                {/* QR Code corner targets */}
                <rect x="5" y="5" width="25" height="25" fill="black"/>
                <rect x="9" y="9" width="17" height="17" fill="white"/>
                <rect x="13" y="13" width="9" height="9" fill="black"/>

                <rect x="70" y="5" width="25" height="25" fill="black"/>
                <rect x="74" y="9" width="17" height="17" fill="white"/>
                <rect x="78" y="13" width="9" height="9" fill="black"/>

                <rect x="5" y="70" width="25" height="25" fill="black"/>
                <rect x="9" y="74" width="17" height="17" fill="white"/>
                <rect x="13" y="78" width="9" height="9" fill="black"/>

                {/* Random QR pattern blocks */}
                <rect x="35" y="5" width="8" height="8" fill="black"/>
                <rect x="48" y="5" width="8" height="15" fill="black"/>
                <rect x="35" y="20" width="15" height="8" fill="black"/>
                <rect x="5" y="35" width="12" height="12" fill="black"/>
                <rect x="22" y="35" width="20" height="8" fill="black"/>
                <rect x="48" y="30" width="10" height="20" fill="black"/>
                <rect x="65" y="35" width="30" height="8" fill="black"/>
                <rect x="70" y="48" width="12" height="12" fill="black"/>
                <rect x="88" y="48" width="8" height="20" fill="black"/>
                <rect x="35" y="50" width="8" height="20" fill="black"/>
                <rect x="10" y="52" width="15" height="8" fill="black"/>
                <rect x="48" y="60" width="15" height="8" fill="black"/>
                <rect x="35" y="75" width="20" height="10" fill="black"/>
                <rect x="60" y="70" width="10" height="25" fill="black"/>
                <rect x="75" y="75" width="20" height="8" fill="black"/>
                <rect x="75" y="88" width="10" height="8" fill="black"/>
              </svg>
            </div>

            {/* Simulated Barcode */}
            <div className="flex flex-col items-center">
              <div className="h-16 flex items-end space-x-0.5 bg-white p-1">
                {[3,1,2,1,4,1,2,3,1,1,2,4,1,3,2,1,2,1,3,1,4,1,2,2,1,3,1,2].map((width, idx) => (
                  <div
                    key={idx}
                    className="bg-black h-full"
                    style={{ width: `${width * 1.5}px` }}
                  ></div>
                ))}
              </div>
              <span className="text-[10px] tracking-widest font-mono mt-1">
                {ticketData.code}
              </span>
            </div>
          </div>

          {/* Validation Notice */}
          <p className="text-[9px] text-center uppercase tracking-tight text-slate-500 font-sans">
            VÁLIDO APENAS PARA A DATA E HORA INDICADAS • CONSERVE ESTE BILHETE
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400 font-sans">
          Cinemax Angola • Todos os direitos reservados
        </div>
      </main>

      {/* Screen Helper Text (Hidden when printing) */}
      <footer className="no-print mt-8 text-center text-xs text-slate-500 max-w-md">
        <p>
          💡 <strong>Dica de Impressão:</strong> Na janela do navegador, selecione 
          <em>"Guardar como PDF"</em> na impressora para salvar o seu bilhete digitalmente.
        </p>
      </footer>
    </div>
  );
}