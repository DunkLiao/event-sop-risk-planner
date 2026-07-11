import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import CelebrationIcon from '@mui/icons-material/Celebration';
import ClassIcon from '@mui/icons-material/Class';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FestivalIcon from '@mui/icons-material/Festival';
import GroupsIcon from '@mui/icons-material/Groups';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MuseumIcon from '@mui/icons-material/Museum';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SchoolIcon from '@mui/icons-material/School';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import type { ComponentType } from 'react';
import { EventType } from '../types/event';

export interface EventTypeIconConfig {
  primary: ComponentType<SvgIconProps>;
  accent: ComponentType<SvgIconProps>;
}

export const EVENT_TYPE_ICON_MAP: Record<EventType, EventTypeIconConfig> = {
  [EventType.CONFERENCE]: {
    primary: GroupsIcon,
    accent: BusinessIcon,
  },
  [EventType.EXHIBITION]: {
    primary: MuseumIcon,
    accent: BusinessIcon,
  },
  [EventType.CONCERT]: {
    primary: MusicNoteIcon,
    accent: LibraryMusicIcon,
  },
  [EventType.SPORTS]: {
    primary: SportsScoreIcon,
    accent: EmojiEventsIcon,
  },
  [EventType.CORPORATE]: {
    primary: CorporateFareIcon,
    accent: BusinessIcon,
  },
  [EventType.WEDDING]: {
    primary: FavoriteIcon,
    accent: CelebrationIcon,
  },
  [EventType.FESTIVAL]: {
    primary: FestivalIcon,
    accent: CelebrationIcon,
  },
  [EventType.SEMINAR]: {
    primary: SchoolIcon,
    accent: MenuBookIcon,
  },
  [EventType.WORKSHOP]: {
    primary: ClassIcon,
    accent: SchoolIcon,
  },
  [EventType.OTHER]: {
    primary: MoreHorizIcon,
    accent: CategoryIcon,
  },
};

export const getEventTypeIcons = (eventType: EventType): EventTypeIconConfig => EVENT_TYPE_ICON_MAP[eventType];
