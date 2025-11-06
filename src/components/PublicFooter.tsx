import { Link } from "react-router-dom";
import { Instagram, Linkedin, Facebook, Mail, Phone } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-[hsl(var(--dark-bg))] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Coluna 1: Logo e Tagline */}
          <div>
            <div className="text-2xl font-bold mb-4">
              <span className="text-primary">Digital</span>
              <span className="text-secondary"> Hera</span>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Transformando negócios através do marketing digital estratégico
            </p>
          </div>

          {/* Coluna 2: Links Rápidos */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/sobre" className="text-sm text-gray-300 hover:text-secondary transition-colors">
                  Sobre
                </Link>
              </li>
              <li>
                <Link to="/servicos" className="text-sm text-gray-300 hover:text-secondary transition-colors">
                  Serviços
                </Link>
              </li>
              <li>
                <Link to="/fundadora" className="text-sm text-gray-300 hover:text-secondary transition-colors">
                  Fundadora
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-sm text-gray-300 hover:text-secondary transition-colors">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Serviços Principais */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">Serviços</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Social Media</li>
              <li>Gestão de Tráfego</li>
              <li>Infoprodutos</li>
              <li>Lançamentos</li>
              <li>Branding</li>
            </ul>
          </div>

          {/* Coluna 4: Contato e Redes Sociais */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">Contato</h3>
            <ul className="space-y-3 mb-4">
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Mail className="h-4 w-4 text-secondary" />
                contato@digitalhera.com.br
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Phone className="h-4 w-4 text-secondary" />
                (XX) XXXXX-XXXX
              </li>
            </ul>
            <div className="flex space-x-4">
              <a
                href="https://instagram.com/digitalhera.mkt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-secondary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/company/digitalhera"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-secondary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com/digitalhera"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-secondary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-sm text-gray-400">
            © 2025 Digital Hera. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
