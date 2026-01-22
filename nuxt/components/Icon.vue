<template>
  <component :is="iconComponent" :class="['icon', sizeClass]" />
</template>

<script setup>
import { computed, markRaw } from 'vue'

// Outline 图标
import {
  HomeIcon,
  Bars3Icon,
  Bars4Icon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SunIcon,
  MoonIcon,
  FolderIcon,
  FolderOpenIcon,
  CalendarIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  DocumentMinusIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  BookOpenIcon,
  Squares2X2Icon,
  PhotoIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  LinkIcon,
  CodeBracketIcon,
  CodeBracketSquareIcon,
  CpuChipIcon,
  PuzzlePieceIcon,
  BoltIcon,
  ComputerDesktopIcon,
  ServerStackIcon,
  CloudIcon,
  ServerIcon,
  CircleStackIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  Bars3BottomLeftIcon,
  EyeIcon,
  ClockIcon,
  TagIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  LightBulbIcon,
  TrashIcon,
  EllipsisHorizontalIcon,
  ArrowDownTrayIcon,
  WrenchScrewdriverIcon,
  KeyIcon,
  DocumentDuplicateIcon,
  InboxIcon,
  PlusCircleIcon,
  EnvelopeIcon,
  MapPinIcon,
  ArrowUpTrayIcon,
  BookmarkIcon
} from '@heroicons/vue/24/outline'

// Solid 图标 (用于 solid 变体)
import {
  HomeIcon as HomeIconSolid,
  SunIcon as SunIconSolid,
  MoonIcon as MoonIconSolid,
  HeartIcon as HeartIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  BoltIcon as BoltIconSolid
} from '@heroicons/vue/24/solid'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'].includes(v)
  },
  solid: {
    type: Boolean,
    default: false
  }
})

// Outline 图标注册表
const outlineIcons = {
  'home': HomeIcon,
  'house': HomeIcon,
  'bars-3': Bars3Icon,
  'list': Bars3Icon,
  'menu': Bars3Icon,
  'bars-4': Bars4Icon,
  'view-stacked': Bars4Icon,
  'x-mark': XMarkIcon,
  'x-lg': XMarkIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-down': ChevronDownIcon,
  'chevron-left': ChevronLeftIcon,
  'chevron-right': ChevronRightIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-right': ArrowRightIcon,
  'sun': SunIcon,
  'sun-fill': SunIcon,
  'moon': MoonIcon,
  'moon-fill': MoonIcon,
  'folder': FolderIcon,
  'folder-open': FolderOpenIcon,
  'folder2-open': FolderOpenIcon,
  'calendar': CalendarIcon,
  'calendar3': CalendarIcon,
  'pencil-square': PencilSquareIcon,
  'document-text': DocumentTextIcon,
  'journal-text': DocumentTextIcon,
  'file-text': DocumentTextIcon,
  'document-minus': DocumentMinusIcon,
  'file-earmark-x': DocumentMinusIcon,
  'book-open': BookOpenIcon,
  'book': BookOpenIcon,
  'squares-2x2': Squares2X2Icon,
  'grid': Squares2X2Icon,
  'grid-3x3-gap': Squares2X2Icon,
  'grid-3x3-gap-fill': Squares2X2Icon,
  'photo': PhotoIcon,
  'images': PhotoIcon,
  'image': PhotoIcon,
  'magnifying-glass-plus': MagnifyingGlassPlusIcon,
  'zoom-in': MagnifyingGlassPlusIcon,
  'magnifying-glass-minus': MagnifyingGlassMinusIcon,
  'zoom-out': MagnifyingGlassMinusIcon,
  'arrows-pointing-in': ArrowsPointingInIcon,
  'arrows-angle-contract': ArrowsPointingInIcon,
  'arrows-pointing-out': ArrowsPointingOutIcon,
  'arrows-fullscreen': ArrowsPointingOutIcon,
  'heart': HeartIcon,
  'heart-fill': HeartIcon,
  'chat-bubble-oval-left': ChatBubbleOvalLeftIcon,
  'chat-dots': ChatBubbleOvalLeftIcon,
  'chat-bubble-bottom-center-text': ChatBubbleBottomCenterTextIcon,
  'chat-left-text': ChatBubbleBottomCenterTextIcon,
  'chat-bubble-left-right': ChatBubbleLeftRightIcon,
  'chat-square-dots': ChatBubbleLeftRightIcon,
  'check-circle': CheckCircleIcon,
  'paper-airplane': PaperAirplaneIcon,
  'send': PaperAirplaneIcon,
  'user-circle': UserCircleIcon,
  'person-circle': UserCircleIcon,
  'link': LinkIcon,
  'link-45deg': LinkIcon,
  'code': CodeBracketIcon,
  'code-bracket': CodeBracketIcon,
  'code-slash': CodeBracketIcon,
  'github': CodeBracketIcon,
  'code-bracket-square': CodeBracketSquareIcon,
  'code-square': CodeBracketSquareIcon,
  'cpu-chip': CpuChipIcon,
  'robot': CpuChipIcon,
  'puzzle-piece': PuzzlePieceIcon,
  'controller': PuzzlePieceIcon,
  'bolt': BoltIcon,
  'lightning-charge-fill': BoltIcon,
  'computer-desktop': ComputerDesktopIcon,
  'window-stack': ComputerDesktopIcon,
  'server-stack': ServerStackIcon,
  'hdd-network': ServerStackIcon,
  'cloud': CloudIcon,
  'clouds': CloudIcon,
  'server': ServerIcon,
  'circle-stack': CircleStackIcon,
  'database': CircleStackIcon,
  'device-phone-mobile': DevicePhoneMobileIcon,
  'phone': DevicePhoneMobileIcon,
  'chart-bar': ChartBarIcon,
  'activity': ChartBarIcon,
  'arrow-top-right-on-square': ArrowTopRightOnSquareIcon,
  'box-arrow-up-right': ArrowTopRightOnSquareIcon,
  'list-bullet': ListBulletIcon,
  'list-ul': ListBulletIcon,
  'magnifying-glass': MagnifyingGlassIcon,
  'search': MagnifyingGlassIcon,
  'arrow-path': ArrowPathIcon,
  'arrow-clockwise': ArrowPathIcon,
  'bars-3-bottom-left': Bars3BottomLeftIcon,
  'layout-sidebar': Bars3BottomLeftIcon,
  'layout-text-sidebar-reverse': Bars3BottomLeftIcon,
  'eye': EyeIcon,
  'clock': ClockIcon,
  'key': KeyIcon,
  'tag': TagIcon,
  'information-circle': InformationCircleIcon,
  'exclamation-circle': ExclamationCircleIcon,
  'lightbulb': LightBulbIcon,
  'light-bulb': LightBulbIcon,
  'trash': TrashIcon,
  'trash-can': TrashIcon,
  'delete': TrashIcon,
  'ellipsis-horizontal': EllipsisHorizontalIcon,
  'three-dots': EllipsisHorizontalIcon,
  'dots': EllipsisHorizontalIcon,
  'file-earmark-text': DocumentTextIcon,
  'file-pdf': DocumentArrowDownIcon,
  'file-word': DocumentArrowUpIcon,
  'document-arrow-down': DocumentArrowDownIcon,
  'document-arrow-up': DocumentArrowUpIcon,
  'document-duplicate': DocumentDuplicateIcon,
  'copy': DocumentDuplicateIcon,
  'download': ArrowDownTrayIcon,
  'arrow-down-tray': ArrowDownTrayIcon,
  'wrench-screwdriver': WrenchScrewdriverIcon,
  'inbox': InboxIcon,
  'plus-circle': PlusCircleIcon,
  'plus': PlusCircleIcon,
  'envelope': EnvelopeIcon,
  'mail': EnvelopeIcon,
  'map-pin': MapPinIcon,
  'location': MapPinIcon,
  'arrow-up-tray': ArrowUpTrayIcon,
  'upload': ArrowUpTrayIcon,
  'save': BookmarkIcon,
  'bookmark': BookmarkIcon
}

// Solid 图标注册表
const solidIcons = {
  'home': HomeIconSolid,
  'house': HomeIconSolid,
  'sun': SunIconSolid,
  'sun-fill': SunIconSolid,
  'moon': MoonIconSolid,
  'moon-fill': MoonIconSolid,
  'heart': HeartIconSolid,
  'heart-fill': HeartIconSolid,
  'squares-2x2': Squares2X2IconSolid,
  'grid': Squares2X2IconSolid,
  'grid-3x3-gap-fill': Squares2X2IconSolid,
  'check-circle': CheckCircleIconSolid,
  'bolt': BoltIconSolid,
  'lightning-charge-fill': BoltIconSolid
}

// 获取图标组件
const iconComponent = computed(() => {
  const name = props.name.toLowerCase()
  
  // 优先查找 solid 图标
  if (props.solid && solidIcons[name]) {
    return markRaw(solidIcons[name])
  }
  
  // 查找 outline 图标
  if (outlineIcons[name]) {
    return markRaw(outlineIcons[name])
  }
  
  // 未找到图标时返回 null
  console.warn(`[Icon] 未找到图标: ${props.name}`)
  return null
})

const sizeClass = computed(() => `icon-${props.size}`)
</script>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}

.icon-xs {
  width: 0.75rem;
  height: 0.75rem;
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

.icon-lg {
  width: 1.5rem;
  height: 1.5rem;
}

.icon-xl {
  width: 2rem;
  height: 2rem;
}

.icon-2xl {
  width: 2.5rem;
  height: 2.5rem;
}

.icon-3xl {
  width: 3rem;
  height: 3rem;
}
</style>
