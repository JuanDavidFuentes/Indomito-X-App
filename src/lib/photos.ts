import type { PhotoId } from '@juandavidfuentes/indomitox-shared';
import type { ImageSourcePropType } from 'react-native';

/**
 * Fotos de aventura empaquetadas con la app (WebP). Los créditos están en PHOTO_CREDITS
 * (shared) y se muestran en Perfil. Se generan con design-system/indomito-x/fotos/procesar-fotos.mjs.
 */
export const PHOTOS: Record<PhotoId, ImageSourcePropType> = {
  'hero-chicamocha-parapente': require('../../assets/images/photos/hero-chicamocha-parapente.webp'),
  'agua-rafting-fonce': require('../../assets/images/photos/agua-rafting-fonce.webp'),
  'aire-parapente-san-gil': require('../../assets/images/photos/aire-parapente-san-gil.webp'),
  'tierra-escalada': require('../../assets/images/photos/tierra-escalada.webp'),
  'subterraneo-cueva-vaca': require('../../assets/images/photos/subterraneo-cueva-vaca.webp'),
  'parque-bungee': require('../../assets/images/photos/parque-bungee.webp'),
  'cueva-vaca-curiti': require('../../assets/images/photos/cueva-vaca-curiti.webp'),
  torrentismo: require('../../assets/images/photos/torrentismo.webp'),
  'destino-chicamocha': require('../../assets/images/photos/destino-chicamocha.webp'),
  'destino-san-gil': require('../../assets/images/photos/destino-san-gil.webp'),
  'destino-barichara': require('../../assets/images/photos/destino-barichara.webp'),
  'destino-curiti': require('../../assets/images/photos/destino-curiti.webp'),
  'guia-rafting': require('../../assets/images/photos/guia-rafting.webp'),
};
