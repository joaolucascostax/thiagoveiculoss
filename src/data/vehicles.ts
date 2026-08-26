export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: string;
  price: number;
  mileage: string;
  transmission: string;
  fuel: string;
  color: string;
  doors: number;
  isNew: boolean;
  images: string[];
  options: string[];
  description: string;
}

export const vehicles: Vehicle[] = [
  {
    id: "1",
    brand: "BMW",
    model: "320I M SPORT",
    year: "2024/2024",
    price: 289900,
    mileage: "15.000 KM",
    transmission: "AUTOMÁTICO",
    fuel: "GASOLINA",
    color: "PRETO SAFIRA",
    doors: 4,
    isNew: false,
    images: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80",
      "https://images.unsplash.com/photo-1602776001315-0e5e17527db3?w=800&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80",
    ],
    options: [
      "TETO SOLAR PANORÂMICO",
      "BANCOS EM COURO VERNASCA",
      "CENTRAL MULTIMÍDIA 12.3\"",
      "HEAD-UP DISPLAY",
      "ASSISTENTE DE ESTACIONAMENTO",
      "FAROIS FULL LED ADAPTIVOS",
    ],
    description:
      "Veículo em excelente estado de conservação. Revisões em dia na concessionária autorizada. Interior impecável com bancos em couro premium. Equipado com os principais opcionais de série da linha M Sport, incluindo suspensão esportiva e acabamento exclusivo.",
  },
  {
    id: "2",
    brand: "PORSCHE",
    model: "MACAN 2.0 T",
    year: "2023/2023",
    price: 445000,
    mileage: "22.500 KM",
    transmission: "PDK 7V",
    fuel: "GASOLINA",
    color: "BRANCO",
    doors: 4,
    isNew: false,
    images: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
      "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80",
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
    ],
    options: [
      "SPORT CHRONO PACKAGE",
      "RODAS 21\" MACAN TURBO",
      "SOM BOSE SURROUND",
      "TETO SOLAR PANORÂMICO",
      "PARK ASSIST COM CÂMERA 360°",
      "FARÓIS MATRIX LED PDLS+",
    ],
    description:
      "Porsche Macan em estado impecável. Único dono, todas as revisões realizadas na rede Porsche. Pacote Sport Chrono com volante multifuncional e modo de condução individual. Interior em couro bicolor com acabamento em alumínio escovado.",
  },
  {
    id: "3",
    brand: "PORSCHE",
    model: "911 CARRERA S PDK",
    year: "2024/2024",
    price: 1150000,
    mileage: "0 KM",
    transmission: "PDK 8 MARCHAS",
    fuel: "GASOLINA",
    color: "CINZA ARTIC",
    doors: 2,
    isNew: true,
    images: [
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&q=80",
      "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800&q=80",
      "https://images.unsplash.com/photo-1611859266164-66b33056ef5e?w=800&q=80",
      "https://images.unsplash.com/photo-1584345604476-8ec5f82bd3a2?w=800&q=80",
    ],
    options: [
      "TETO SOLAR ELÉTRICO",
      "SOM BOSE SURROUND",
      "BANCOS 18 VIAS",
      "SPORT CHRONO PACKAGE",
      "RODAS 20/21 CARRERA S",
      "FARÓIS MATRIX LED",
    ],
    description:
      "Veículo em estado de zero quilômetro. Único dono, sem detalhes de pintura ou uso. Equipado com os opcionais mais desejados da linha Carrera S, incluindo interior em couro bicolor e sistema de escape esportivo com ponteiras pretas.\n\nGarantia de fábrica vigente até 2026. Documentação pronta para transferência imediata. Uma verdadeira obra de arte da engenharia alemã pronta para o seu garage.",
  },
  {
    id: "4",
    brand: "MERCEDES-BENZ",
    model: "C 300 AMG LINE",
    year: "2023/2024",
    price: 375000,
    mileage: "8.200 KM",
    transmission: "AUTOMÁTICO 9G",
    fuel: "GASOLINA",
    color: "CINZA SELENITA",
    doors: 4,
    isNew: false,
    images: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80",
      "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80",
    ],
    options: [
      "PACOTE AMG LINE EXTERIOR",
      "INTERIOR AMG EM COURO ARTICO",
      "DIGITAL LIGHT",
      "BURMESTER 3D SURROUND",
      "SUSPENSÃO AIRMATIC",
      "HEADS-UP DISPLAY",
    ],
    description:
      "Mercedes-Benz C 300 AMG Line com baixíssima quilometragem. Veículo de procedência, único dono. Equipado com o pacote completo AMG Line que inclui acabamento externo esportivo, rodas AMG de 19 polegadas e interior com bancos esportivos em couro.",
  },
  {
    id: "5",
    brand: "AUDI",
    model: "RS 5 SPORTBACK",
    year: "2022/2023",
    price: 620000,
    mileage: "12.000 KM",
    transmission: "TIPTRONIC 8V",
    fuel: "GASOLINA",
    color: "AZUL NAVARRA",
    doors: 4,
    isNew: false,
    images: [
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
      "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&q=80",
      "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
    ],
    options: [
      "PACOTE RS DESIGN",
      "ESCAPE RS ESPORTIVO",
      "BANCOS RS EM COURO NAPPA",
      "VIRTUAL COCKPIT PLUS",
      "BANG & OLUFSEN 3D",
      "MATRIX LED COM LASER",
    ],
    description:
      "Audi RS 5 Sportback com motor V6 biturbo de 450 cv. Performance extraordinária combinada com o conforto de um Gran Turismo. Tração Quattro integral, diferencial esportivo traseiro e suspensão adaptativa RS.",
  },
  {
    id: "6",
    brand: "LAND ROVER",
    model: "RANGE ROVER SPORT HSE",
    year: "2024/2024",
    price: 890000,
    mileage: "3.500 KM",
    transmission: "AUTOMÁTICO 8V",
    fuel: "DIESEL",
    color: "VERDE BRITISH",
    doors: 4,
    isNew: false,
    images: [
      "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
    ],
    options: [
      "TETO SOLAR PANORÂMICO",
      "SOM MERIDIAN SIGNATURE",
      "BANCOS VENTILADOS",
      "HEAD-UP DISPLAY",
      "SUSPENSÃO PNEUMÁTICA",
      "CÂMERA 360° 3D SURROUND",
    ],
    description:
      "Range Rover Sport HSE com motor diesel de alta performance. Presença imponente combinada com tecnologia de ponta e conforto supremo. Interior em couro Windsor com acabamento em madeira aberta e alumínio.",
  },
];

export function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR");
}
