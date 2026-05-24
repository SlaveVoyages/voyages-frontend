import { useEffect } from 'react';

import { Divider } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import HeaderLogoSearch from '@/components/NavigationComponents/Header/HeaderSearchLogo';
import { useInstitutionAuthor } from '@/hooks/useInstitutionAuthor';
import {
  setInstitutionAuthorsData,
  setInstitutionAuthorsList,
} from '@/redux/getBlogDataSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { BASEURL } from '@/share/AUTH_BASEURL';
import {
  BlogDataPropsRequest,
  BlogFilter,
  InitialStateBlogProps,
  InstitutionAuthor,
} from '@/share/InterfaceTypesBlog';
import '@/style/blogs.scss';

import InstitutionAuthorsList from './InstitutionAuthorsList';
import HeaderNavBarBlog from '../../NavigationComponents/Header/HeaderNavBarBlog';

const InstitutionAuthors: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { ID } = useParams();

  const { institutionData } = useSelector(
    (state: RootState) => state.getBlogData as InitialStateBlogProps,
  );
  const { image, name, description } = institutionData;

  const filters: BlogFilter[] = [];
  const parsedID = ID ? parseInt(ID) : NaN;
  if (!isNaN(parsedID)) {
    filters.push({
      varName: 'id',
      searchTerm: [parsedID],
      op: 'in',
    });
  }
  const dataSend: BlogDataPropsRequest = {
    filter: filters || [],
    page: 0,
    page_size: 12,
  };
  const { data, isLoading, isError } = useInstitutionAuthor(dataSend);

  useEffect(() => {
    if (!isLoading && !isError && data) {
      const { results } = data;
      dispatch(setInstitutionAuthorsData(results?.[0]));
      const institutionList = results[0]?.institution_authors.map(
        (value: InstitutionAuthor) => value,
      );
      dispatch(setInstitutionAuthorsList(institutionList));
    }
    return () => {
      setInstitutionAuthorsList([]);
    };
  }, [data, isLoading, isError, dispatch, ID]);

  return (
    <div className="blog-container">
      <HeaderLogoSearch />
      <HeaderNavBarBlog />
      <div className="container-new-institution">
        <div className="main-body">
          <div className="row-next-author">
            <div className="card-body">
              <div className="d-flex flex-column align-items-center text-center">
                {image ? (
                  <img
                    src={`${BASEURL}${image}`}
                    alt={name}
                    className="rounded-circle"
                    width="300"
                  />
                ) : (
                  <div className="avatar">
                    <i className="fas fa-user fa-3x" aria-hidden="true"></i>
                  </div>
                )}
                <div className="mt-3">
                  <h4 className="auther-name">{name}</h4>
                  <p className="text-secondary-author">{description ?? '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Divider />
        <InstitutionAuthorsList />
      </div>
    </div>
  );
};
export default InstitutionAuthors;
