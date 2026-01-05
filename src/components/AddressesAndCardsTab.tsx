import React, { useState, useEffect } from 'react';
import { MapPin, CreditCard, Plus, Edit, Trash2, Phone, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  delivery_instructions: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface PaymentCard {
  id: string;
  user_id: string;
  label: string;
  card_holder_name: string;
  card_number_last_four: string;
  card_type: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface AddressesAndCardsTabProps {
  userId: string;
}

const AddressesAndCardsTab: React.FC<AddressesAndCardsTabProps> = ({ userId }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editingCard, setEditingCard] = useState<PaymentCard | null>(null);

  const [addressForm, setAddressForm] = useState({
    label: '',
    full_name: '',
    phone: '',
    address: '',
    city: '',
    delivery_instructions: '',
    is_default: false
  });

  const [cardForm, setCardForm] = useState({
    label: '',
    card_holder_name: '',
    card_number: '',
    card_type: '',
    expiry_month: '',
    expiry_year: '',
    is_default: false
  });

  useEffect(() => {
    if (userId) {
      fetchAddresses();
      fetchCards();
    }
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('client_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      toast.error('Error al cargar direcciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_cards')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error: any) {
      console.error('Error fetching cards:', error);
      toast.error('Error al cargar tarjetas');
    }
  };

  const handleOpenAddressModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        label: address.label,
        full_name: address.full_name,
        phone: address.phone,
        address: address.address,
        city: address.city,
        delivery_instructions: address.delivery_instructions || '',
        is_default: address.is_default
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        label: '',
        full_name: '',
        phone: '',
        address: '',
        city: '',
        delivery_instructions: '',
        is_default: false
      });
    }
    setAddressModalOpen(true);
  };

  const handleOpenCardModal = (card?: PaymentCard) => {
    if (card) {
      setEditingCard(card);
      setCardForm({
        label: card.label,
        card_holder_name: card.card_holder_name,
        card_number: `**** **** **** ${card.card_number_last_four}`,
        card_type: card.card_type,
        expiry_month: card.expiry_month.toString().padStart(2, '0'),
        expiry_year: card.expiry_year.toString(),
        is_default: card.is_default
      });
    } else {
      setEditingCard(null);
      setCardForm({
        label: '',
        card_holder_name: '',
        card_number: '',
        card_type: '',
        expiry_month: '',
        expiry_year: '',
        is_default: false
      });
    }
    setCardModalOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!addressForm.label || !addressForm.full_name || !addressForm.phone || !addressForm.address || !addressForm.city) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      // If setting as default, unset other defaults first
      if (addressForm.is_default) {
        await supabase
          .from('client_addresses')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('is_default', true);
      }

      if (editingAddress) {
        const { error } = await supabase
          .from('client_addresses')
          .update({
            label: addressForm.label,
            full_name: addressForm.full_name,
            phone: addressForm.phone,
            address: addressForm.address,
            city: addressForm.city,
            delivery_instructions: addressForm.delivery_instructions || null,
            is_default: addressForm.is_default
          })
          .eq('id', editingAddress.id);

        if (error) throw error;
        toast.success('Dirección actualizada exitosamente');
      } else {
        const { error } = await supabase
          .from('client_addresses')
          .insert({
            user_id: userId,
            ...addressForm,
            delivery_instructions: addressForm.delivery_instructions || null
          });

        if (error) throw error;
        toast.success('Dirección agregada exitosamente');
      }

      setAddressModalOpen(false);
      fetchAddresses();
    } catch (error: any) {
      console.error('Error saving address:', error);
      toast.error('Error al guardar dirección');
    }
  };

  const handleSaveCard = async () => {
    if (!cardForm.label || !cardForm.card_holder_name || !cardForm.card_number || !cardForm.card_type || !cardForm.expiry_month || !cardForm.expiry_year) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validate card number (should be 16 digits)
    const cardNumberDigits = cardForm.card_number.replace(/\s/g, '');
    if (cardNumberDigits.length !== 16 || !/^\d+$/.test(cardNumberDigits)) {
      toast.error('El número de tarjeta debe tener 16 dígitos');
      return;
    }

    const expiryMonth = parseInt(cardForm.expiry_month);
    const expiryYear = parseInt(cardForm.expiry_year);

    if (expiryMonth < 1 || expiryMonth > 12) {
      toast.error('Mes de expiración inválido');
      return;
    }

    if (expiryYear < new Date().getFullYear()) {
      toast.error('Año de expiración inválido');
      return;
    }

    try {
      // If setting as default, unset other defaults first
      if (cardForm.is_default) {
        await supabase
          .from('payment_cards')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('is_default', true);
      }

      const lastFour = cardNumberDigits.slice(-4);

      if (editingCard) {
        const { error } = await supabase
          .from('payment_cards')
          .update({
            label: cardForm.label,
            card_holder_name: cardForm.card_holder_name,
            card_number_last_four: lastFour,
            card_type: cardForm.card_type,
            expiry_month: expiryMonth,
            expiry_year: expiryYear,
            is_default: cardForm.is_default
          })
          .eq('id', editingCard.id);

        if (error) throw error;
        toast.success('Tarjeta actualizada exitosamente');
      } else {
        const { error } = await supabase
          .from('payment_cards')
          .insert({
            user_id: userId,
            label: cardForm.label,
            card_holder_name: cardForm.card_holder_name,
            card_number_last_four: lastFour,
            card_type: cardForm.card_type,
            expiry_month: expiryMonth,
            expiry_year: expiryYear,
            is_default: cardForm.is_default
          });

        if (error) throw error;
        toast.success('Tarjeta agregada exitosamente');
      }

      setCardModalOpen(false);
      fetchCards();
    } catch (error: any) {
      console.error('Error saving card:', error);
      toast.error('Error al guardar tarjeta');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta dirección?')) return;

    try {
      const { error } = await supabase
        .from('client_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Dirección eliminada exitosamente');
      fetchAddresses();
    } catch (error: any) {
      console.error('Error deleting address:', error);
      toast.error('Error al eliminar dirección');
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarjeta?')) return;

    try {
      const { error } = await supabase
        .from('payment_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Tarjeta eliminada exitosamente');
      fetchCards();
    } catch (error: any) {
      console.error('Error deleting card:', error);
      toast.error('Error al eliminar tarjeta');
    }
  };

  const formatCardNumber = (cardNumber: string) => {
    // Remove all spaces
    const digits = cardNumber.replace(/\s/g, '');
    // Add space every 4 digits
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '').slice(0, 16);
    setCardForm(prev => ({ ...prev, card_number: formatCardNumber(value) }));
  };

  const getCardIcon = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
      case 'american express':
        return '💳';
      default:
        return '💳';
    }
  };

  return (
    <div className="space-y-6">
      {/* Addresses Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <MapPin className="w-6 h-6 text-orange-500" />
            <h3 className="text-xl font-bold text-gray-800">Direcciones de Entrega</h3>
          </div>
          <Button
            onClick={() => handleOpenAddressModal()}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
          >
            <Plus size={16} className="mr-2" />
            Agregar Dirección
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-4">No tienes direcciones guardadas</p>
            <Button onClick={() => handleOpenAddressModal()} variant="outline">
              Agregar Primera Dirección
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <Card key={address.id} className={address.is_default ? 'border-2 border-orange-500' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-800">{address.label}</h4>
                        {address.is_default && (
                          <Badge variant="default" className="bg-orange-500">
                            <Star size={12} className="mr-1" />
                            Predeterminada
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="font-medium text-gray-800">{address.full_name}</p>
                        <p className="flex items-center">
                          <Phone size={14} className="mr-2" />
                          {address.phone}
                        </p>
                        <p className="flex items-start">
                          <MapPin size={14} className="mr-2 mt-0.5" />
                          {address.address}
                        </p>
                        <p>{address.city}</p>
                        {address.delivery_instructions && (
                          <p className="text-xs text-gray-500 italic mt-2">
                            {address.delivery_instructions}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAddressModal(address)}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment Cards Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-bold text-gray-800">Tarjetas de Pago</h3>
          </div>
          <Button
            onClick={() => handleOpenCardModal()}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600"
          >
            <Plus size={16} className="mr-2" />
            Agregar Tarjeta
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-4">No tienes tarjetas guardadas</p>
            <Button onClick={() => handleOpenCardModal()} variant="outline">
              Agregar Primera Tarjeta
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card) => (
              <Card key={card.id} className={card.is_default ? 'border-2 border-blue-500' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-800">{card.label}</h4>
                        {card.is_default && (
                          <Badge variant="default" className="bg-blue-500">
                            <Star size={12} className="mr-1" />
                            Predeterminada
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="text-2xl mb-2">{getCardIcon(card.card_type)}</p>
                        <p className="font-mono text-lg font-semibold">
                          **** **** **** {card.card_number_last_four}
                        </p>
                        <p className="font-medium text-gray-800">{card.card_holder_name}</p>
                        <p className="text-gray-600">
                          {card.expiry_month.toString().padStart(2, '0')}/{card.expiry_year}
                        </p>
                        <Badge variant="outline" className="mt-2">
                          {card.card_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenCardModal(card)}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Address Modal */}
      <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Editar Dirección' : 'Agregar Nueva Dirección'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="address-label">Etiqueta *</Label>
              <Input
                id="address-label"
                value={addressForm.label}
                onChange={(e) => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Ej: Casa, Trabajo, Oficina"
                required
              />
            </div>

            <div>
              <Label htmlFor="address-full-name">Nombre Completo *</Label>
              <Input
                id="address-full-name"
                value={addressForm.full_name}
                onChange={(e) => setAddressForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nombre completo"
                required
              />
            </div>

            <div>
              <Label htmlFor="address-phone">Teléfono *</Label>
              <Input
                id="address-phone"
                value={addressForm.phone}
                onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+502 1234-5678"
                required
              />
            </div>

            <div>
              <Label htmlFor="address-street">Dirección *</Label>
              <Textarea
                id="address-street"
                value={addressForm.address}
                onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección completa"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="address-city">Ciudad *</Label>
              <Input
                id="address-city"
                value={addressForm.city}
                onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Ciudad"
                required
              />
            </div>

            <div>
              <Label htmlFor="address-instructions">Instrucciones de Entrega</Label>
              <Textarea
                id="address-instructions"
                value={addressForm.delivery_instructions}
                onChange={(e) => setAddressForm(prev => ({ ...prev, delivery_instructions: e.target.value }))}
                placeholder="Instrucciones especiales para la entrega..."
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="address-default"
                checked={addressForm.is_default}
                onCheckedChange={(checked) => setAddressForm(prev => ({ ...prev, is_default: checked as boolean }))}
              />
              <Label htmlFor="address-default" className="cursor-pointer">
                Establecer como dirección predeterminada
              </Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setAddressModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAddress} className="bg-gradient-to-r from-orange-500 to-red-500">
                {editingAddress ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Modal */}
      <Dialog open={cardModalOpen} onOpenChange={setCardModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCard ? 'Editar Tarjeta' : 'Agregar Nueva Tarjeta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="card-label">Etiqueta *</Label>
              <Input
                id="card-label"
                value={cardForm.label}
                onChange={(e) => setCardForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Ej: Tarjeta Principal, Tarjeta de Trabajo"
                required
              />
            </div>

            <div>
              <Label htmlFor="card-holder-name">Nombre del Titular *</Label>
              <Input
                id="card-holder-name"
                value={cardForm.card_holder_name}
                onChange={(e) => setCardForm(prev => ({ ...prev, card_holder_name: e.target.value }))}
                placeholder="Nombre como aparece en la tarjeta"
                required
              />
            </div>

            <div>
              <Label htmlFor="card-number">Número de Tarjeta *</Label>
              <Input
                id="card-number"
                value={cardForm.card_number}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <Label htmlFor="card-type">Tipo *</Label>
                <Select value={cardForm.card_type} onValueChange={(value) => setCardForm(prev => ({ ...prev, card_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Visa">Visa</SelectItem>
                    <SelectItem value="Mastercard">Mastercard</SelectItem>
                    <SelectItem value="Amex">American Express</SelectItem>
                    <SelectItem value="Other">Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="card-expiry-month">Mes *</Label>
                <Select value={cardForm.expiry_month} onValueChange={(value) => setCardForm(prev => ({ ...prev, expiry_month: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                        {month.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="card-expiry-year">Año *</Label>
                <Select value={cardForm.expiry_year} onValueChange={(value) => setCardForm(prev => ({ ...prev, expiry_year: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="card-default"
                checked={cardForm.is_default}
                onCheckedChange={(checked) => setCardForm(prev => ({ ...prev, is_default: checked as boolean }))}
              />
              <Label htmlFor="card-default" className="cursor-pointer">
                Establecer como tarjeta predeterminada
              </Label>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                🔒 Tu información de pago está protegida. Solo almacenamos los últimos 4 dígitos de tu tarjeta.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setCardModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCard} className="bg-gradient-to-r from-blue-500 to-cyan-500">
                {editingCard ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressesAndCardsTab;

