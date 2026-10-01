// Ícono de un hábito (fase 21): traduce el id del catálogo de `shared` a su componente de Lucide.
// Un import por ícono: así el paquete solo carga los del catálogo y no la librería entera.
import { habitIconOf, type HabitIcon as HabitIconId } from '@ascua/shared';
import type { LucideIcon } from 'lucide-react-native';
import Activity from 'lucide-react-native/icons/activity';
import AlarmClock from 'lucide-react-native/icons/alarm-clock';
import Apple from 'lucide-react-native/icons/apple';
import Ban from 'lucide-react-native/icons/ban';
import Bandage from 'lucide-react-native/icons/bandage';
import Bath from 'lucide-react-native/icons/bath';
import Bed from 'lucide-react-native/icons/bed';
import BedDouble from 'lucide-react-native/icons/bed-double';
import BeerOff from 'lucide-react-native/icons/beer-off';
import Bike from 'lucide-react-native/icons/bike';
import BookOpen from 'lucide-react-native/icons/book-open';
import Brain from 'lucide-react-native/icons/brain';
import Briefcase from 'lucide-react-native/icons/briefcase';
import Broom from 'lucide-react-native/icons/broom';
import BrushCleaning from 'lucide-react-native/icons/brush-cleaning';
import Calculator from 'lucide-react-native/icons/calculator';
import CalendarCheck from 'lucide-react-native/icons/calendar-check';
import Camera from 'lucide-react-native/icons/camera';
import CandyOff from 'lucide-react-native/icons/candy-off';
import Car from 'lucide-react-native/icons/car';
import Church from 'lucide-react-native/icons/church';
import CigaretteOff from 'lucide-react-native/icons/cigarette-off';
import Clock from 'lucide-react-native/icons/clock';
import Code from 'lucide-react-native/icons/code';
import Coffee from 'lucide-react-native/icons/coffee';
import CookingPot from 'lucide-react-native/icons/cooking-pot';
import Droplet from 'lucide-react-native/icons/droplet';
import Dumbbell from 'lucide-react-native/icons/dumbbell';
import Eye from 'lucide-react-native/icons/eye';
import FileText from 'lucide-react-native/icons/file-text';
import Flame from 'lucide-react-native/icons/flame';
import Flower2 from 'lucide-react-native/icons/flower-2';
import Footprints from 'lucide-react-native/icons/footprints';
import Gamepad2 from 'lucide-react-native/icons/gamepad-2';
import Glasses from 'lucide-react-native/icons/glasses';
import GlassWater from 'lucide-react-native/icons/glass-water';
import GraduationCap from 'lucide-react-native/icons/graduation-cap';
import Guitar from 'lucide-react-native/icons/guitar';
import HandHeart from 'lucide-react-native/icons/hand-heart';
import Headphones from 'lucide-react-native/icons/headphones';
import Heart from 'lucide-react-native/icons/heart';
import HeartPulse from 'lucide-react-native/icons/heart-pulse';
import Hourglass from 'lucide-react-native/icons/hourglass';
import House from 'lucide-react-native/icons/house';
import Languages from 'lucide-react-native/icons/languages';
import Laptop from 'lucide-react-native/icons/laptop';
import Leaf from 'lucide-react-native/icons/leaf';
import Library from 'lucide-react-native/icons/library';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import Microscope from 'lucide-react-native/icons/microscope';
import Moon from 'lucide-react-native/icons/moon';
import Mountain from 'lucide-react-native/icons/mountain';
import Music from 'lucide-react-native/icons/music';
import NotebookPen from 'lucide-react-native/icons/notebook-pen';
import Palette from 'lucide-react-native/icons/palette';
import PawPrint from 'lucide-react-native/icons/paw-print';
import Pencil from 'lucide-react-native/icons/pencil';
import PenLine from 'lucide-react-native/icons/pen-line';
import PersonStanding from 'lucide-react-native/icons/person-standing';
import PhoneOff from 'lucide-react-native/icons/phone-off';
import PiggyBank from 'lucide-react-native/icons/piggy-bank';
import Pill from 'lucide-react-native/icons/pill';
import Plane from 'lucide-react-native/icons/plane';
import Rocket from 'lucide-react-native/icons/rocket';
import Salad from 'lucide-react-native/icons/salad';
import Scissors from 'lucide-react-native/icons/scissors';
import Shirt from 'lucide-react-native/icons/shirt';
import ShoppingCart from 'lucide-react-native/icons/shopping-cart';
import ShowerHead from 'lucide-react-native/icons/shower-head';
import Smartphone from 'lucide-react-native/icons/smartphone';
import Sofa from 'lucide-react-native/icons/sofa';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Sprout from 'lucide-react-native/icons/sprout';
import Star from 'lucide-react-native/icons/star';
import Stethoscope from 'lucide-react-native/icons/stethoscope';
import StretchHorizontal from 'lucide-react-native/icons/stretch-horizontal';
import Sun from 'lucide-react-native/icons/sun';
import Sunrise from 'lucide-react-native/icons/sunrise';
import Syringe from 'lucide-react-native/icons/syringe';
import Target from 'lucide-react-native/icons/target';
import Terminal from 'lucide-react-native/icons/terminal';
import Timer from 'lucide-react-native/icons/timer';
import Toothbrush from 'lucide-react-native/icons/toothbrush';
import Trash from 'lucide-react-native/icons/trash';
import Trophy from 'lucide-react-native/icons/trophy';
import Tv from 'lucide-react-native/icons/tv';
import Users from 'lucide-react-native/icons/users';
import Utensils from 'lucide-react-native/icons/utensils';
import Volleyball from 'lucide-react-native/icons/volleyball';
import Wallet from 'lucide-react-native/icons/wallet';
import WashingMachine from 'lucide-react-native/icons/washing-machine';
import WavesLadder from 'lucide-react-native/icons/waves-ladder';
import Weight from 'lucide-react-native/icons/weight';
import Wind from 'lucide-react-native/icons/wind';
import WineOff from 'lucide-react-native/icons/wine-off';

const ICONS: Record<HabitIconId, LucideIcon> = {
  heart: Heart,
  'heart-pulse': HeartPulse,
  pill: Pill,
  droplet: Droplet,
  'glass-water': GlassWater,
  apple: Apple,
  salad: Salad,
  utensils: Utensils,
  moon: Moon,
  bed: Bed,
  sun: Sun,
  sunrise: Sunrise,
  'shower-head': ShowerHead,
  bath: Bath,
  toothbrush: Toothbrush,
  stethoscope: Stethoscope,
  syringe: Syringe,
  bandage: Bandage,
  'cigarette-off': CigaretteOff,
  'wine-off': WineOff,
  'beer-off': BeerOff,
  'candy-off': CandyOff,
  dumbbell: Dumbbell,
  bike: Bike,
  footprints: Footprints,
  activity: Activity,
  timer: Timer,
  trophy: Trophy,
  'waves-ladder': WavesLadder,
  mountain: Mountain,
  'person-standing': PersonStanding,
  volleyball: Volleyball,
  flame: Flame,
  weight: Weight,
  'stretch-horizontal': StretchHorizontal,
  brain: Brain,
  leaf: Leaf,
  wind: Wind,
  sparkles: Sparkles,
  'flower-2': Flower2,
  'notebook-pen': NotebookPen,
  'pen-line': PenLine,
  music: Music,
  headphones: Headphones,
  eye: Eye,
  'phone-off': PhoneOff,
  smartphone: Smartphone,
  hourglass: Hourglass,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  pencil: Pencil,
  code: Code,
  laptop: Laptop,
  languages: Languages,
  calculator: Calculator,
  library: Library,
  'file-text': FileText,
  lightbulb: Lightbulb,
  briefcase: Briefcase,
  terminal: Terminal,
  microscope: Microscope,
  house: House,
  'brush-cleaning': BrushCleaning,
  broom: Broom,
  shirt: Shirt,
  'washing-machine': WashingMachine,
  'cooking-pot': CookingPot,
  'shopping-cart': ShoppingCart,
  trash: Trash,
  'paw-print': PawPrint,
  sprout: Sprout,
  'bed-double': BedDouble,
  sofa: Sofa,
  'gamepad-2': Gamepad2,
  tv: Tv,
  camera: Camera,
  palette: Palette,
  guitar: Guitar,
  coffee: Coffee,
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  clock: Clock,
  'alarm-clock': AlarmClock,
  'calendar-check': CalendarCheck,
  target: Target,
  star: Star,
  users: Users,
  'message-circle': MessageCircle,
  'hand-heart': HandHeart,
  church: Church,
  plane: Plane,
  car: Car,
  scissors: Scissors,
  glasses: Glasses,
  ban: Ban,
  rocket: Rocket,
};

interface HabitIconProps {
  /** El campo `icon` del hábito tal como está guardado. */
  icon: unknown;
  size?: number;
  color: string;
}

/** El ícono elegido de un hábito. No dibuja nada si no tiene o si el guardado no está en el catálogo. */
export function HabitIcon({ icon, size = 18, color }: HabitIconProps) {
  const id = habitIconOf(icon);
  if (!id) return null;
  const Icon = ICONS[id];
  return <Icon size={size} color={color} strokeWidth={2} />;
}
