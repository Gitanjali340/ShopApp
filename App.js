import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, FlatList, Image, Dimensions, ScrollView, KeyboardAvoidingView, Platform, Animated, Easing, Switch, LayoutAnimation, UIManager, Modal, LogBox } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
// --- NEW IMPORT FOR PRO ICONS ---
import { Ionicons } from '@expo/vector-icons';

// --- IGNORE WARNINGS ---
LogBox.ignoreLogs(['setLayoutAnimationEnabledExperimental', 'SafeAreaView has been deprecated']);

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// --- THEMES ---
const lightColors = {
  mode: 'light',
  primary: '#2563EB',   // Royal Blue
  secondary: '#F59E0B', // Amber
  background: '#F3F4F6', 
  card: '#FFFFFF',       
  text: '#111827',       
  textLight: '#6B7280',
  border: '#E5E7EB',     
  danger: '#EF4444',
  success: '#10B981',
  inputBg: '#FFFFFF',
  shadow: '#000'
};

const darkColors = {
  mode: 'dark',
  primary: '#6366F1',   // Glowing Indigo
  secondary: '#FBBF24', 
  background: '#000000', 
  card: '#000000',       
  text: '#FFFFFF',       
  textLight: '#9CA3AF',
  border: '#333333',     
  danger: '#F87171',
  success: '#34D399',
  inputBg: '#121212',
  shadow: 'transparent'
};

// --- CONTEXT ---
const AppContext = createContext();

// --- HELPER: DATE CALCULATOR ---
const getDeliveryDate = (daysToAdd) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
};

// --- ANIMATION COMPONENTS ---
const ScalePress = ({ onPress, style, children, disabled }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scaleValue, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 10 }).start();
  const onPressOut = () => Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 10 }).start();
  return (
    <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} activeOpacity={1} disabled={disabled} style={{ width: style?.width || 'auto' }}>
      <Animated.View style={[style, { transform: [{ scale: scaleValue }], opacity: disabled ? 0.6 : 1 }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

const FadeInView = ({ children, style, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: delay, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ]).start();
  }, []);
  return <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>{children}</Animated.View>;
};

// --- MOCK PRODUCTS ---
const MOCK_PRODUCTS = [
  { id: '1', name: 'Pro Wireless Headphones', price: 2999, stock: 45, deliveryDays: 2, image: 'https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=600', description: 'Experience crystal clear sound.', rating: 4.5, reviews: [{ id: 'r1', user: 'Amit P.', rating: 5, comment: 'Bass is amazing.', date: '2 days ago' }] },
  { id: '2', name: 'Smart Watch Series 5', price: 5499, stock: 12, deliveryDays: 4, image: 'https://images.pexels.com/photos/267394/pexels-photo-267394.jpeg?auto=compress&cs=tinysrgb&w=600', description: 'Stay connected and healthy.', rating: 4.0, reviews: [{ id: 'r3', user: 'Rahul D.', rating: 5, comment: 'Looks premium.', date: 'Yesterday' }] },
  { id: '3', name: 'Sport Running Shoes', price: 1850, stock: 8, deliveryDays: 3, image: 'https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600', description: 'Lightweight and durable.', rating: 4.8, reviews: [{ id: 'r5', user: 'Vikram S.', rating: 5, comment: 'Very comfortable.', date: '1 month ago' }] },
  { id: '4', name: 'RGB Gaming Mouse', price: 1200, stock: 60, deliveryDays: 1, image: 'https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg?auto=compress&cs=tinysrgb&w=600', description: 'High-precision tracking.', rating: 4.2, reviews: [{ id: 'r6', user: 'Gamer123', rating: 5, comment: 'Headshots are easier now!', date: '5 days ago' }] },
  { id: '5', name: 'Mechanical Keyboard', price: 4500, stock: 0, deliveryDays: 5, image: 'https://images.pexels.com/photos/1772123/pexels-photo-1772123.jpeg?auto=compress&cs=tinysrgb&w=600', description: 'Tactile and clicky switches.', rating: 4.7, reviews: [{ id: 'r8', user: 'CodeMaster', rating: 5, comment: 'Typing feels like heaven.', date: '1 day ago' }] }, 
  { id: '6', name: '4K Camera Lens', price: 15899, stock: 5, deliveryDays: 7, image: 'https://images.pexels.com/photos/279906/pexels-photo-279906.jpeg?auto=compress&cs=tinysrgb&w=600', description: 'Professional grade lens.', rating: 4.9, reviews: [{ id: 'r9', user: 'PhotoPro', rating: 5, comment: 'Crisp images.', date: '2 days ago' }] },
];

const Stack = createStackNavigator();
const { width } = Dimensions.get('window');

// --- HELPER: RENDER STARS ---
const renderStars = (rating, colors) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(<Ionicons key={i} name={i <= rating ? "star" : "star-outline"} size={14} color={i <= rating ? colors.secondary : colors.border} />);
  }
  return <View style={{ flexDirection: 'row' }}>{stars}</View>;
};

// --- SCREEN 1: LOGIN ---
function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, colors } = useContext(AppContext);

  const handleAuth = () => {
    if (email && password) {
      signIn({ 
        email, 
        role: email === 'admin@test.com' ? 'admin' : 'user', 
        name: email === 'admin@test.com' ? 'Gitanjali' : 'Rahul Sharma', 
        phone: '9988776655' 
      });
    } else {
      Alert.alert('Error', 'Please enter an email and password');
    }
  };

  return (
    <View style={[styles.authContainer, {backgroundColor: colors.primary}]}>
      <View style={styles.authCircle} />
      <FadeInView style={[styles.authContent, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
        <View style={{alignItems: 'center', marginBottom: 20}}>
           <Ionicons name="cart" size={60} color={colors.primary} />
           <Text style={[styles.appTitle, {color: colors.primary}]}>ShopApp</Text>
        </View>
        <Text style={[styles.authSubtitle, {color: colors.textLight}]}>{isLogin ? 'Welcome Back' : 'Join the Revolution'}</Text>
        <View style={styles.inputGroup}>
          <TextInput style={[styles.modernInput, {backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, borderWidth: 1}]} placeholder="Email" placeholderTextColor={colors.textLight} value={email} onChangeText={setEmail} autoCapitalize="none"/>
          <TextInput style={[styles.modernInput, {backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, borderWidth: 1}]} placeholder="Password" placeholderTextColor={colors.textLight} value={password} onChangeText={setPassword} secureTextEntry/>
        </View>
        <ScalePress style={[styles.gradientButton, {backgroundColor: colors.primary}]} onPress={handleAuth}>
          <Text style={styles.gradientButtonText}>{isLogin ? 'LOG IN' : 'SIGN UP'}</Text>
        </ScalePress>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{marginTop: 20}}>
          <Text style={[styles.linkText, {color: colors.textLight}]}>{isLogin ? "New here? " : "Member? "} <Text style={{fontWeight: 'bold', textDecorationLine: 'underline', color: colors.primary}}>{isLogin ? "Create account" : "Login"}</Text></Text>
        </TouchableOpacity>
      </FadeInView>
    </View>
  );
}

// --- SCREEN 2: HOME ---
function HomeScreen({ navigation }) {
  const { user, cart, addToCart, colors } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(MOCK_PRODUCTS);

  useEffect(() => {
    if (search === '') setFilteredProducts(MOCK_PRODUCTS);
    else setFilteredProducts(MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase())));
  }, [search]);

  if (!user) return null;

  const handlePlusPress = (item) => {
    if (item.stock > 0) {
      addToCart(item);
    } else {
      Alert.alert('Out of Stock', 'This item is currently unavailable.');
    }
  };

  const renderProduct = ({ item, index }) => (
    <ScalePress style={styles.productCardWrapper} onPress={() => navigation.navigate('ProductDetails', { product: item })}>
      <FadeInView delay={index * 100} style={[
          styles.productCard, 
          { 
            backgroundColor: colors.card, 
            shadowColor: colors.shadow,
            borderColor: colors.border,
            borderWidth: colors.mode === 'dark' ? 1 : 0 
          }
      ]}>
        <View style={[styles.imageContainer, {backgroundColor: colors.inputBg}]}>
           <Image source={{ uri: item.image }} style={styles.productImage} />
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, {color: colors.text}]} numberOfLines={1}>{item.name}</Text>
          <View style={{flexDirection:'row', alignItems:'center', marginTop: 4}}>
              {renderStars(Math.round(item.rating), colors)}
              <Text style={{fontSize:10, color:colors.textLight, marginLeft: 5}}>({item.reviews.length})</Text>
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8}}>
              <Text style={[styles.productPrice, {color: colors.text}]}>₹{item.price}</Text>
              <TouchableOpacity 
                style={[styles.miniAddBtn, {backgroundColor: item.stock === 0 ? colors.textLight : colors.primary}]} 
                onPress={() => handlePlusPress(item)}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
          </View>
        </View>
      </FadeInView>
    </ScalePress>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={[styles.headerArea, {backgroundColor: colors.background}]}>
        <View style={styles.headerTop}>
          <View>
             <Text style={[styles.welcomeText, {color: colors.text}]}>Hello, {user.name.split(' ')[0]} 👋</Text>
             <Text style={[styles.subWelcome, {color: colors.textLight}]}>What are you buying today?</Text>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <ScalePress style={styles.iconBtn} onPress={() => navigation.navigate('Cart')}>
               <Ionicons name="cart-outline" size={28} color={colors.text} />
               {(cart?.length || 0) > 0 && <View style={[styles.badge, {backgroundColor: colors.danger}]}><Text style={styles.badgeText}>{cart.length}</Text></View>}
            </ScalePress>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
               <View style={[styles.avatarSmall, {backgroundColor: colors.primary}]}><Text style={{color: 'white', fontWeight:'bold'}}>{user.name[0]}</Text></View>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.searchBar, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Ionicons name="search-outline" size={20} color={colors.textLight} style={{marginRight: 10}} />
          <TextInput 
            placeholder="Search products..." 
            style={{flex: 1, fontSize: 16, color: colors.text, height: '100%'}} 
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={colors.textLight}
          />
        </View>
      </View>

      <FlatList 
        data={filteredProducts} 
        renderItem={renderProduct} 
        keyExtractor={item => item.id} 
        numColumns={2} 
        columnWrapperStyle={styles.row} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ padding: 20, paddingTop: 10 }}
      />
      
      {user.role === 'admin' && (
        <ScalePress style={[styles.floatingAdminBtn, {backgroundColor: colors.primary}]} onPress={() => navigation.navigate('Admin')}>
          <Text style={styles.buttonText}>Admin Panel</Text>
        </ScalePress>
      )}
    </SafeAreaView>
  );
}

// --- SCREEN 3: PRODUCT DETAILS ---
function ProductDetailsScreen({ route, navigation }) {
  const { product } = route.params; 
  const { addToCart, colors } = useContext(AppContext);
  const arrivalDate = getDeliveryDate(product.deliveryDays);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <FadeInView style={[styles.detailImageHeader, {backgroundColor: colors.card}]}>
           <Image source={{ uri: product.image }} style={styles.detailImage} />
        </FadeInView>
        
        <View style={[styles.detailSheet, {backgroundColor: colors.background}]}>
          <View style={styles.handleBar} />
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
             <View style={{flex: 1}}>
                <Text style={[styles.detailName, {color: colors.text}]}>{product.name}</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
                   {renderStars(product.rating, colors)}
                   <Text style={{marginLeft: 8, color: colors.textLight}}>{product.reviews.length} ratings</Text>
                </View>
             </View>
             <Text style={[styles.detailPriceLarge, {color: colors.primary}]}>₹{product.price}</Text>
          </View>
          <View style={[styles.deliveryTag, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
             <Text style={{color: colors.primary, fontWeight: 'bold'}}>🚚 Fast Delivery</Text>
             <Text style={{color: colors.text, fontSize: 12}}>Arrives by {arrivalDate}</Text>
          </View>
          <Text style={[styles.sectionHeader, {color: colors.text}]}>Description</Text>
          <Text style={[styles.detailDesc, {color: colors.textLight}]}>{product.description}</Text>
          <Text style={[styles.sectionHeader, {color: colors.text}]}>Reviews</Text>
          {product.reviews.map((review) => (
            <FadeInView key={review.id} style={[styles.reviewCard, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
              <View style={styles.reviewHeader}>
                  <View style={[styles.reviewAvatar, {backgroundColor: colors.textLight}]}><Text style={{color:'white', fontSize: 10, fontWeight: 'bold'}}>{review.user[0]}</Text></View>
                  <Text style={[styles.reviewUser, {color: colors.text}]}>{review.user}</Text>
              </View>
              <View style={{flexDirection:'row', marginBottom: 4}}>{renderStars(review.rating, colors)}</View>
              <Text style={[styles.reviewComment, {color: colors.textLight}]}>{review.comment}</Text>
            </FadeInView>
          ))}
        </View>
      </ScrollView>
      <FadeInView delay={300} style={[styles.floatingFooter, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <View>
            <Text style={{color: colors.textLight, fontSize: 12}}>Total Price</Text>
            <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.text}}>₹{product.price}</Text>
        </View>
        <ScalePress 
           style={[styles.buyButton, {backgroundColor: product.stock === 0 ? colors.textLight : colors.secondary}]} 
           disabled={product.stock === 0} 
           onPress={() => addToCart(product)}
        >
          <Text style={styles.buttonText}>{product.stock > 0 ? 'Add to Cart' : 'Sold Out'}</Text>
        </ScalePress>
      </FadeInView>
    </View>
  );
}

// --- SCREEN 4: CART ---
function CartScreen({ navigation }) {
  const { cart, removeFromCart, placeOrder, user, colors } = useContext(AppContext);
  const [successVisible, setSuccessVisible] = useState(false); 

  if (!user) return null;
  const safeCart = cart || [];
  const total = safeCart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    safeCart.forEach((item) => {
      const singleOrder = {
        id: Math.floor(Math.random() * 100000).toString(),
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        total: item.price,
        items: [item],
        status: 'Processing',
        arrival: getDeliveryDate(item.deliveryDays)
      };
      placeOrder(singleOrder, false);
    });
    placeOrder(null, true); 
    setSuccessVisible(true);
  };

  const closeSuccess = () => {
    setSuccessVisible(false);
    navigation.navigate('Home');
  };

  const renderCartItem = ({ item, index }) => (
    <FadeInView delay={index * 100} style={[styles.cartItem, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
      <Image source={{uri: item.image}} style={[styles.cartImage, {backgroundColor: colors.inputBg}]} />
      <View style={{flex: 1, marginLeft: 15}}>
        <Text style={[styles.cartName, {color: colors.text}]}>{item.name}</Text>
        <Text style={[styles.cartPrice, {color: colors.primary}]}>₹{item.price}</Text>
      </View>
      <TouchableOpacity onPress={() => removeFromCart(index)} style={styles.removeBtn}>
         <Ionicons name="close-circle" size={24} color={colors.danger} />
      </TouchableOpacity>
    </FadeInView>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* CUSTOM SUCCESS MODAL */}
      <Modal visible={successVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
            <View style={[styles.modalIcon, {backgroundColor: colors.success}]}>
               <Ionicons name="checkmark" size={30} color="white" />
            </View>
            <Text style={[styles.modalTitle, {color: colors.text}]}>Order Placed!</Text>
            <Text style={[styles.modalSub, {color: colors.textLight}]}>Thank you for your purchase.</Text>
            <TouchableOpacity onPress={closeSuccess} style={[styles.modalButton, {backgroundColor: colors.primary}]}>
              <Text style={{color: 'white', fontWeight: 'bold'}}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {safeCart.length === 0 ? (
        <View style={styles.centerEmpty}>
           <Ionicons name="cart-outline" size={60} color={colors.textLight} />
           <Text style={[styles.emptyText, {color: colors.textLight}]}>Your cart is empty 😔</Text>
        </View>
      ) : (
        <>
          <FlatList data={safeCart} renderItem={renderCartItem} keyExtractor={(item, index) => index.toString()} contentContainerStyle={{padding: 20}} />
          <View style={[styles.checkoutPanel, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15}}>
                <Text style={[styles.totalLabel, {color: colors.textLight}]}>Total</Text>
                <Text style={[styles.totalValue, {color: colors.text}]}>₹{total}</Text>
            </View>
            <ScalePress style={[styles.checkoutBtn, {backgroundColor: colors.primary}]} onPress={handleCheckout}>
              <Text style={styles.buttonText}>Checkout ({safeCart.length})</Text>
            </ScalePress>
          </View>
        </>
      )}
    </View>
  );
}

// --- SUB-SCREEN: ORDERS ---
function OrdersScreen() {
  const { orders, colors } = useContext(AppContext);
  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
       {orders.length === 0 ? (
         <View style={styles.centerEmpty}><Text style={[styles.emptyText, {color: colors.textLight}]}>No past orders.</Text></View>
       ) : (
         <FlatList 
           data={orders}
           contentContainerStyle={{padding: 20}}
           keyExtractor={item => item.id}
           renderItem={({item}) => (
             <FadeInView style={[styles.orderCard, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
               <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10}}>
                  <Text style={{fontWeight: 'bold', color: colors.text}}>Order #{item.id}</Text>
                  <Text style={{color: colors.primary, fontWeight: 'bold', backgroundColor: colors.inputBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4}}>{item.status}</Text>
               </View>
               <Text style={{color: colors.textLight, fontSize: 12}}>Placed on {item.date}</Text>
               <View style={styles.divider} />
               {item.items.map((prod, idx) => (<Text key={idx} style={{fontSize: 13, color: colors.text}}>• {prod.name}</Text>))}
               <View style={{marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontWeight: 'bold', fontSize: 16, color: colors.text}}>₹{item.total}</Text>
                  <Text style={{fontSize: 11, color: colors.textLight}}>Arriving: {item.arrival}</Text>
               </View>
             </FadeInView>
           )}
         />
       )}
    </View>
  );
}

function SecurityScreen() {
  const { user, updateUser, colors } = useContext(AppContext);
  const [data, setData] = useState({ name: user.name, email: user.email, phone: user.phone });
  const handleSave = () => { updateUser(data); Alert.alert('Success', 'Profile updated!'); };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={[styles.formCard, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
        <Text style={[styles.inputLabel, {color: colors.text}]}>Full Name</Text>
        <TextInput style={[styles.modernInput, {backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, borderWidth: 1}]} value={data.name} onChangeText={t => setData({...data, name: t})} />
        <Text style={[styles.inputLabel, {color: colors.text}]}>Email Address</Text>
        <TextInput style={[styles.modernInput, {backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, borderWidth: 1}]} value={data.email} onChangeText={t => setData({...data, email: t})} />
        <Text style={[styles.inputLabel, {color: colors.text}]}>Phone</Text>
        <TextInput style={[styles.modernInput, {backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, borderWidth: 1}]} value={data.phone} onChangeText={t => setData({...data, phone: t})} keyboardType="phone-pad" />
        <ScalePress style={[styles.gradientButton, {backgroundColor: colors.primary}]} onPress={handleSave}><Text style={styles.gradientButtonText}>Save Changes</Text></ScalePress>
      </View>
    </View>
  );
}

function AddressesScreen() {
  const { addresses, addAddress, removeAddress, updateAddress, colors } = useContext(AppContext);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [newAddr, setNewAddr] = useState({ street: '', city: '', zip: '' });

  const handleSave = () => {
    if(!newAddr.street || !newAddr.city) return Alert.alert('Error', 'Fill all fields');
    if (editingId) updateAddress(editingId, newAddr);
    else addAddress({ ...newAddr, id: Date.now().toString() });
    handleCancel();
  };

  const handleEditClick = (item) => { setNewAddr(item); setEditingId(item.id); setShowForm(true); };
  const handleCancel = () => { setNewAddr({ street: '', city: '', zip: '' }); setEditingId(null); setShowForm(false); };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.container, {backgroundColor: colors.background}]} keyboardVerticalOffset={90}>
      <FlatList 
        data={addresses}
        contentContainerStyle={{padding: 20}}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <FadeInView style={[styles.addressCard, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
               <Ionicons name="home" size={24} color={colors.primary} style={{marginRight: 10}} />
               <View>
                 <Text style={{fontWeight: 'bold', color: colors.text}}>{item.street}</Text>
                 <Text style={{color: colors.textLight}}>{item.city}, {item.zip}</Text>
               </View>
            </View>
            <View style={styles.addressActions}>
              <TouchableOpacity onPress={() => handleEditClick(item)} style={[styles.actionPill, {backgroundColor: colors.inputBg}]}>
                <Text style={{color: colors.primary, fontSize: 12, fontWeight: 'bold'}}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeAddress(item.id)} style={[styles.actionPill, {backgroundColor: colors.inputBg}]}>
                <Text style={{color: colors.danger, fontSize: 12, fontWeight: 'bold'}}>Remove</Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        )}
      />

      {showForm ? (
        <View style={[styles.bottomSheetForm, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
          <Text style={[styles.sheetTitle, {color: colors.text}]}>{editingId ? 'Edit Address' : 'Add New Address'}</Text>
          <TextInput style={[styles.sheetInput, {backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, borderWidth: 1}]} placeholder="Street Address" placeholderTextColor={colors.textLight} value={newAddr.street} onChangeText={t => setNewAddr({...newAddr, street: t})} />
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
             <TextInput style={[styles.sheetInput, {width: '48%', backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, borderWidth: 1}]} placeholder="City" placeholderTextColor={colors.textLight} value={newAddr.city} onChangeText={t => setNewAddr({...newAddr, city: t})} />
             <TextInput style={[styles.sheetInput, {width: '48%', backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, borderWidth: 1}]} placeholder="Zip" placeholderTextColor={colors.textLight} value={newAddr.zip} onChangeText={t => setNewAddr({...newAddr, zip: t})} />
          </View>
          <View style={{flexDirection:'row', marginTop: 10}}>
             <ScalePress onPress={handleCancel} style={[styles.sheetButton, {backgroundColor: colors.border, marginRight: 10}]}><Text style={{color: colors.text}}>Cancel</Text></ScalePress>
             <ScalePress onPress={handleSave} style={[styles.sheetButton, {backgroundColor: colors.primary}]}><Text style={{color: 'white'}}>Save</Text></ScalePress>
          </View>
        </View>
      ) : (
        <ScalePress style={[styles.fab, {backgroundColor: colors.primary}]} onPress={() => setShowForm(true)}>
          <Ionicons name="add" size={30} color="white" />
        </ScalePress>
      )}
    </KeyboardAvoidingView>
  );
}

// --- SCREEN 5: PROFILE ---
function ProfileScreen({ navigation }) {
  const { user, signOut, colors, isDarkMode, toggleTheme } = useContext(AppContext);
  if (!user) return null;

  const MenuButton = ({ icon, title, target }) => (
    <ScalePress style={[styles.menuItem, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]} onPress={() => navigation.navigate(target)}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <View style={[styles.menuIconBox, {backgroundColor: colors.inputBg}]}>
           <Ionicons name={icon} size={20} color={colors.text} />
        </View>
        <Text style={[styles.menuText, {color: colors.text}]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </ScalePress>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={[styles.profileHero, {backgroundColor: colors.card}]}>
        <View style={[styles.profileAvatarLarge, {backgroundColor: colors.inputBg}]}><Text style={{fontSize: 30, color: colors.primary, fontWeight: 'bold'}}>{user.name[0]}</Text></View>
        <Text style={[styles.profileHeroName, {color: colors.text}]}>{user.name}</Text>
        <Text style={[styles.profileHeroEmail, {color: colors.textLight}]}>{user.email}</Text>
      </View>
      <View style={styles.menuList}>
        <View style={[styles.menuItem, {backgroundColor: colors.card, justifyContent:'space-between', marginBottom: 10, borderColor: colors.border, borderWidth: 1}]}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
               <View style={[styles.menuIconBox, {backgroundColor: colors.inputBg}]}>
                  <Ionicons name="moon-outline" size={20} color={colors.text} />
               </View>
               <Text style={[styles.menuText, {color: colors.text}]}>Dark Mode</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{false: '#767577', true: colors.primary}} />
        </View>
        <MenuButton icon="cube-outline" title="Your Orders" target="Orders" />
        <MenuButton icon="shield-checkmark-outline" title="Login & Security" target="Security" />
        <MenuButton icon="location-outline" title="Your Addresses" target="Addresses" />
      </View>
      <ScalePress style={[styles.logoutBtn, {borderColor: colors.danger}]} onPress={signOut}><Text style={[styles.logoutText, {color: colors.danger}]}>Log Out</Text></ScalePress>
    </View>
  );
}

// --- SCREEN 6: ADMIN ---
function AdminScreen() {
  const { user, colors } = useContext(AppContext);
  if (!user) return null;
  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Text style={[styles.pageTitle, {color: colors.text}]}>Admin Dashboard</Text>
      <View style={styles.adminStatsContainer}>
        <View style={[styles.adminStatCard, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}><Text style={[styles.statVal, {color: colors.primary}]}>₹45k</Text><Text style={[styles.statLabel, {color: colors.textLight}]}>Sales</Text></View>
        <View style={[styles.adminStatCard, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}><Text style={[styles.statVal, {color: colors.primary}]}>12</Text><Text style={[styles.statLabel, {color: colors.textLight}]}>Orders</Text></View>
      </View>
      <FlatList 
        data={MOCK_PRODUCTS} 
        keyExtractor={item => item.id} 
        contentContainerStyle={{padding: 20}}
        renderItem={({item}) => (
          <View style={[styles.inventoryRow, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
            <Text style={[styles.invName, {color: colors.text}]}>{item.name}</Text>
            <View style={[styles.stockPill, {backgroundColor: item.stock < 10 ? colors.danger + '20' : colors.success + '20'}]}>
               <Text style={{color: item.stock < 10 ? colors.danger : colors.success, fontSize: 12, fontWeight: 'bold'}}>{item.stock} left</Text>
            </View>
          </View>
        )} 
      />
    </View>
  );
}

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]); 
  const [orders, setOrders] = useState([]); 
  const [addresses, setAddresses] = useState([{ id: '1', street: '123 Tech Park', city: 'Mumbai', zip: '400708' }]); 
  const [isDarkMode, setIsDarkMode] = useState(false);

  const colors = isDarkMode ? darkColors : lightColors;

  const appContextValue = {
    user, cart, orders, addresses, colors, isDarkMode,
    // SMOOTH THEME TRANSITION
    toggleTheme: () => {
      LayoutAnimation.configureNext({
        duration: 700, 
        create: { type: LayoutAnimation.Types.linear, property: LayoutAnimation.Properties.opacity },
        update: { type: LayoutAnimation.Types.linear },
        delete: { type: LayoutAnimation.Types.linear, property: LayoutAnimation.Properties.opacity }
      });
      setIsDarkMode(!isDarkMode);
    },
    signIn: (userData) => setUser(userData),
    signOut: () => { setUser(null); setCart([]); },
    addToCart: (item) => { setCart(c => [...(c||[]), item]); Alert.alert('Added', `${item.name} added to cart`); },
    removeFromCart: (idx) => setCart(cart.filter((_, i) => i !== idx)),
    placeOrder: (order, clear = false) => { 
       if (order) setOrders(prev => [order, ...prev]); 
       if (clear) setCart([]); 
    },
    updateUser: (newData) => setUser({ ...user, ...newData }), 
    addAddress: (addr) => setAddresses([...addresses, addr]),
    removeAddress: (id) => setAddresses(addresses.filter(a => a.id !== id)),
    updateAddress: (id, newDetails) => setAddresses(addresses.map(addr => addr.id === id ? { ...newDetails, id } : addr))
  };

  const MyTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.background, card: colors.card, text: colors.text, border: colors.border },
  };

  return (
    <SafeAreaProvider>
      <AppContext.Provider value={appContextValue}>
        <NavigationContainer theme={MyTheme}>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
          <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
            {user == null ? (
              <Stack.Screen name="Auth" component={AuthScreen} />
            ) : (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ headerShown: true, title: '', headerTransparent: true, headerTintColor: colors.text }} />
                <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: true, title: 'My Bag', headerStyle: {backgroundColor: colors.background, elevation: 0}, headerTintColor: colors.text }} />
                <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'Profile', headerStyle: {backgroundColor: colors.background, elevation: 0}, headerTintColor: colors.text }} />
                <Stack.Screen name="Orders" component={OrdersScreen} options={{ headerShown: true, title: 'Past Orders', headerStyle: {backgroundColor: colors.background}, headerTintColor: colors.text }} />
                <Stack.Screen name="Security" component={SecurityScreen} options={{ headerShown: true, title: 'Security', headerStyle: {backgroundColor: colors.background}, headerTintColor: colors.text }} />
                <Stack.Screen name="Addresses" component={AddressesScreen} options={{ headerShown: true, title: 'Address Book', headerStyle: {backgroundColor: colors.background}, headerTintColor: colors.text }} />
                <Stack.Screen name="Admin" component={AdminScreen} options={{ headerShown: true, title: 'Admin', headerStyle: {backgroundColor: colors.background}, headerTintColor: colors.text }} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </AppContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Auth
  authContainer: { flex: 1, justifyContent: 'center' },
  authCircle: { position: 'absolute', top: -100, left: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.1)' },
  authContent: { margin: 20, padding: 30, borderRadius: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  appTitle: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  authSubtitle: { textAlign: 'center', marginBottom: 30 },
  modernInput: { padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16 },
  gradientButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 5, width: '100%' },
  gradientButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  linkText: { textAlign: 'center', marginTop: 15 },
  // Home
  headerArea: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  welcomeText: { fontSize: 22, fontWeight: 'bold' },
  subWelcome: { fontSize: 14 },
  iconBtn: { marginRight: 15, position: 'relative', width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: -5, right: -5, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', borderRadius: 12, alignItems: 'center', height: 50, paddingHorizontal: 15, borderWidth: 1 },
  row: { justifyContent: 'space-between' },
  productCardWrapper: { width: (width - 50) / 2, marginBottom: 15 },
  productCard: { borderRadius: 10, padding: 10, shadowColor: '#000', shadowOpacity: 0.05, elevation: 3 },
  imageContainer: { height: 130, borderRadius: 12, marginBottom: 10, justifyContent: 'center', alignItems: 'center' },
  productImage: { width: '80%', height: '80%', resizeMode: 'contain' },
  productInfo: { paddingHorizontal: 5 },
  productName: { fontSize: 14, fontWeight: '600' },
  productPrice: { fontSize: 16, fontWeight: 'bold' },
  miniAddBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  // Detail
  detailImageHeader: { height: 350, justifyContent: 'center', alignItems: 'center' },
  detailImage: { width: '80%', height: '80%', resizeMode: 'contain' },
  detailSheet: { marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, flex: 1 },
  handleBar: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  detailName: { fontSize: 24, fontWeight: 'bold', maxWidth: '80%' },
  detailPriceLarge: { fontSize: 26, fontWeight: 'bold' },
  deliveryTag: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderRadius: 10, marginVertical: 20 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
  detailDesc: { lineHeight: 22 },
  floatingFooter: { position: 'absolute', bottom: 0, width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1 },
  buyButton: { paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30, width: 160, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  // Cart & Orders
  cartItem: { flexDirection: 'row', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  cartImage: { width: 60, height: 60, borderRadius: 8, resizeMode: 'contain' },
  cartName: { fontSize: 16, fontWeight: 'bold' },
  cartPrice: { fontWeight: 'bold' },
  removeBtn: { padding: 5 },
  checkoutPanel: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 },
  totalLabel: { fontSize: 16 },
  totalValue: { fontSize: 22, fontWeight: 'bold' },
  checkoutBtn: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, width: '100%' },
  centerEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, marginTop: 15 },
  orderCard: { padding: 15, borderRadius: 12, marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', padding: 30, borderRadius: 20, alignItems: 'center', elevation: 5 },
  modalIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  modalSub: { fontSize: 16, marginBottom: 20 },
  modalButton: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 30 },
  // Profile & Address
  profileHero: { alignItems: 'center', padding: 30, marginBottom: 20 },
  profileAvatarLarge: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  profileHeroName: { fontSize: 22, fontWeight: 'bold' },
  profileHeroEmail: {},
  menuList: { paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 12, marginBottom: 10, width: '100%' },
  menuIconBox: { width: 35, height: 35, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { fontSize: 16, fontWeight: '500' },
  logoutBtn: { margin: 20, padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  logoutText: { fontWeight: 'bold' },
  addressCard: { padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: 10 },
  addressActions: { alignItems: 'flex-end', gap: 8 },
  fab: { position: 'absolute', bottom: 100, right: 30, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 10, zIndex: 999 },
  bottomSheetForm: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 20, position: 'absolute', bottom: 0, width: '100%' },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  sheetInput: { padding: 12, borderRadius: 10, marginBottom: 10 },
  sheetButton: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  formCard: { padding: 20, margin: 20, borderRadius: 15 },
  inputLabel: { fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  // Admin & Review
  floatingAdminBtn: { position: 'absolute', bottom: 30, right: 20, padding: 15, borderRadius: 30, elevation: 10, zIndex: 999 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', padding: 20 },
  adminStatsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, justifyContent: 'space-between' },
  adminStatCard: { width: '48%', padding: 20, borderRadius: 15, alignItems: 'center' },
  statVal: { fontSize: 24, fontWeight: 'bold' },
  statLabel: {},
  inventoryRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  invName: { fontSize: 16, fontWeight: '500' },
  stockPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  reviewCard: { padding: 15, borderRadius: 12, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  reviewAvatar: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  reviewUser: { fontWeight: 'bold' },
  reviewComment: { fontSize: 13 },
});