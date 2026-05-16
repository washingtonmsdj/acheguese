import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

export function EventsCultureSection() {
  const events = [
    { id: 1, title: "Festival de Música Local", date: "15 Jun", location: "Praça Central", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=250&fit=crop", category: "Música" },
    { id: 2, title: "Exposição de Arte Comunitária", date: "18 Jun", location: "Centro Cultural", image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=250&fit=crop", category: "Arte" },
    { id: 3, title: "Teatro de Rua", date: "20 Jun", location: "Largo do Bairro", image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=250&fit=crop", category: "Teatro" },
  ];

  return (
    <section className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1.5 sm:mb-2 flex items-center gap-2">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Eventos e Cultura</h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Agenda cultural do seu território</p>
        </div>
        <Link to="/eventos" className="text-xs sm:text-sm font-medium text-primary hover:opacity-80">Ver agenda</Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Link key={event.id} to={`/eventos/${event.id}`}>
            <Card className="group overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="relative h-36 sm:h-40 md:h-44 overflow-hidden">
                <img src={event.image} alt={event.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Badge className="absolute left-2 top-2 border-0 bg-primary text-primary-foreground text-xs">{event.category}</Badge>
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-primary-foreground">{event.title}</h3>
                </div>
              </div>
              <CardContent className="space-y-1 p-2.5 sm:p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {event.date}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
